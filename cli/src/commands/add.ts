import { readFileSync } from 'fs';
import type { McpConfig, AgentType, AddOptions } from '../types.js';
import { agents, getAllAgentTypes, detectInstalledAgents, isValidAgentType } from '../agents.js';
import { readGlobalConfig, readProjectConfig, parseMcpConfigString } from '../config-reader.js';
import { writeGlobalConfig, writeProjectConfig, mergeMcpConfigs } from '../config-writer.js';
import { sendIngestTelemetryBatch, type IngestTelemetryPayload } from '../telemetry.js';
import { success, error, warn, info, verbose, RESET, BOLD, DIM, TEXT, CYAN } from '../utils.js';

interface AddWritePlan {
  toWrite: string[];
  added: string[];
  replaced: string[];
  skipped: string[];
}

export function classifyAddWriteTargets(
  incomingServers: string[],
  existingServers: string[],
  replace = false
): AddWritePlan {
  const existingSet = new Set(existingServers);
  const replaced = incomingServers.filter((name) => existingSet.has(name));
  const added = incomingServers.filter((name) => !existingSet.has(name));

  if (replace) {
    return {
      toWrite: incomingServers,
      added,
      replaced,
      skipped: [],
    };
  }

  return {
    toWrite: added,
    added,
    replaced: [],
    skipped: replaced,
  };
}

export function buildAddTelemetryPayloads(
  successfulWrites: Map<string, Set<AgentType>>,
  config: McpConfig,
  isGlobal: boolean
): IngestTelemetryPayload[] {
  const payloads: IngestTelemetryPayload[] = [];
  const servers = [...successfulWrites.keys()].sort();

  for (const serverName of servers) {
    const agentSet = successfulWrites.get(serverName);
    const serverConfig = config.mcpServers[serverName];
    if (!agentSet || !serverConfig) {
      continue;
    }

    const agents = [...agentSet].sort().join(',');
    payloads.push({
      mcp_name: serverName,
      raw_config: JSON.stringify({
        mcpServers: {
          [serverName]: serverConfig,
        },
      }),
      agents,
      event: 'install',
      global: isGlobal,
    });
  }

  return payloads;
}

/**
 * Parse add command options
 */
export function parseAddOptions(args: string[]): { input: string | null; options: AddOptions } {
  const options: AddOptions = {};
  let input: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--agent' || arg === '-a') {
      options.agents = [];
      // Collect all agent names until next flag
      while (i + 1 < args.length && !args[i + 1]?.startsWith('-')) {
        i++;
        const agentName = args[i];
        if (agentName && isValidAgentType(agentName)) {
          options.agents.push(agentName);
        } else if (agentName) {
          warn(`Unknown agent: ${agentName}`);
        }
      }
    } else if (arg === '--global' || arg === '-g') {
      options.global = true;
    } else if (arg === '--workspace' || arg === '-w') {
      options.workspace = true;
    } else if (arg === '--replace' || arg === '-r') {
      options.replace = true;
    } else if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (!arg?.startsWith('-') && !input) {
      input = arg ?? null;
    }
  }

  return { input, options };
}

/**
 * Execute add command
 */
export async function runAdd(input: string | null, options: AddOptions): Promise<void> {
  verbose('Running add command', options.verbose ?? false);

  // Parse MCP config from input
  let mcpConfig: McpConfig | null = null;

  if (options.file) {
    // Read from file
    try {
      const content = readFileSync(options.file, 'utf-8');
      mcpConfig = parseMcpConfigString(content);
      if (!mcpConfig) {
        error(`Invalid MCP config in file: ${options.file}`);
        return;
      }
      verbose(`Read config from file: ${options.file}`, options.verbose ?? false);
    } catch (err) {
      error(`Failed to read file: ${options.file}`);
      return;
    }
  } else if (input) {
    // Parse JSON string
    mcpConfig = parseMcpConfigString(input);
    if (!mcpConfig) {
      error('Invalid MCP config JSON');
      return;
    }
  } else {
    error('No MCP config provided. Use JSON string or --file option.');
    console.log(`\n${DIM}Example:${RESET}`);
    console.log(
      `  mcpcm add '{"mcpServers":{"my-server":{"command":"node","args":["/path/to/server.js"]}}}' --agent cursor`
    );
    console.log(`  mcpcm add --file mcp.json --global`);
    return;
  }

  const serverNames = Object.keys(mcpConfig.mcpServers);
  info(`Adding ${serverNames.length} MCP server(s): ${serverNames.join(', ')}`);

  // Determine target agents
  let targetAgents: AgentType[] = [];

  if (options.agents && options.agents.length > 0) {
    targetAgents = options.agents;
  } else if (options.global) {
    targetAgents = await detectInstalledAgents();
    if (targetAgents.length === 0) {
      warn('No installed agents detected. Specify agents with --agent.');
      return;
    }
  } else if (options.workspace) {
    // For workspace, we apply to all agents that have project config support
    targetAgents = getAllAgentTypes().filter((t) => agents[t].projectConfigPath !== null);
  } else {
    error('Specify target with --agent, --global, or --workspace');
    return;
  }

  verbose(`Target agents: ${targetAgents.join(', ')}`, options.verbose ?? false);

  // Apply config to each agent
  let successCount = 0;
  let failCount = 0;
  const allSkippedServers: Map<string, string[]> = new Map(); // server name -> agent names
  const successfulWritesByServer: Map<string, Set<AgentType>> = new Map();
  const failedWritesByServer: Map<string, Set<AgentType>> = new Map();

  const addSuccessfulWrites = (servers: string[], agentType: AgentType): void => {
    for (const server of servers) {
      const writtenAgents = successfulWritesByServer.get(server) ?? new Set<AgentType>();
      writtenAgents.add(agentType);
      successfulWritesByServer.set(server, writtenAgents);
    }
  };

  const addFailedWrites = (servers: string[], agentType: AgentType): void => {
    for (const server of servers) {
      const failedAgents = failedWritesByServer.get(server) ?? new Set<AgentType>();
      failedAgents.add(agentType);
      failedWritesByServer.set(server, failedAgents);
    }
  };

  for (const agentType of targetAgents) {
    const agent = agents[agentType];

    if (options.workspace) {
      // Write to project config
      if (!agent.projectConfigPath) {
        verbose(`${agent.displayName} doesn't support project config`, options.verbose ?? false);
        continue;
      }

      const existing = readProjectConfig(agentType, process.cwd(), options.verbose);
      const existingServers = Object.keys(existing.config?.mcpServers || {});
      const incomingServers = Object.keys(mcpConfig.mcpServers);
      const writePlan = classifyAddWriteTargets(
        incomingServers,
        existingServers,
        options.replace ?? false
      );

      // Track skipped servers
      for (const dup of writePlan.skipped) {
        const agents = allSkippedServers.get(dup) || [];
        agents.push(agent.displayName);
        allSkippedServers.set(dup, agents);
      }

      if (writePlan.toWrite.length === 0) {
        warn(`${agent.displayName}: all servers already exist (skipped)`);
        continue;
      }

      // Filter mcpConfig to only include target servers for this run.
      const filteredConfig: McpConfig = {
        mcpServers: Object.fromEntries(
          Object.entries(mcpConfig.mcpServers).filter(([name]) => writePlan.toWrite.includes(name))
        ),
      };

      const merged = mergeMcpConfigs(
        existing.config || { mcpServers: {} },
        filteredConfig,
        options.replace
      );

      const result = writeProjectConfig(
        agentType,
        merged,
        existing.rawContent,
        process.cwd(),
        options.verbose
      );
      if (result.success) {
        addSuccessfulWrites(writePlan.toWrite, agentType);

        if (writePlan.replaced.length > 0) {
          const additions =
            writePlan.added.length > 0 ? `added ${writePlan.added.join(', ')}; ` : '';
          success(
            `${agent.displayName}: ${additions}replaced ${writePlan.replaced.join(', ')}`
          );
        } else if (writePlan.skipped.length > 0) {
          success(
            `${agent.displayName}: added ${writePlan.added.join(', ')} (skipped: ${writePlan.skipped.join(', ')})`
          );
        } else {
          success(`${agent.displayName}: ${result.path}`);
        }
        successCount++;
      } else {
        addFailedWrites(writePlan.toWrite, agentType);
        error(`${agent.displayName}: ${result.error}`);
        failCount++;
      }
    } else {
      // Write to global config
      if (!agent.globalConfigPath) {
        verbose(`${agent.displayName} doesn't support global config`, options.verbose ?? false);
        continue;
      }

      const existing = readGlobalConfig(agentType, options.verbose);
      const existingServers = Object.keys(existing.config?.mcpServers || {});
      const incomingServers = Object.keys(mcpConfig.mcpServers);
      const writePlan = classifyAddWriteTargets(
        incomingServers,
        existingServers,
        options.replace ?? false
      );

      // Track skipped servers
      for (const dup of writePlan.skipped) {
        const agents = allSkippedServers.get(dup) || [];
        agents.push(agent.displayName);
        allSkippedServers.set(dup, agents);
      }

      if (writePlan.toWrite.length === 0) {
        warn(`${agent.displayName}: all servers already exist (skipped)`);
        continue;
      }

      // Filter mcpConfig to only include target servers for this run.
      const filteredConfig: McpConfig = {
        mcpServers: Object.fromEntries(
          Object.entries(mcpConfig.mcpServers).filter(([name]) => writePlan.toWrite.includes(name))
        ),
      };

      const merged = mergeMcpConfigs(
        existing.config || { mcpServers: {} },
        filteredConfig,
        options.replace
      );

      const result = writeGlobalConfig(agentType, merged, existing.rawContent, options.verbose);
      if (result.success) {
        addSuccessfulWrites(writePlan.toWrite, agentType);

        if (writePlan.replaced.length > 0) {
          const additions =
            writePlan.added.length > 0 ? `added ${writePlan.added.join(', ')}; ` : '';
          success(
            `${agent.displayName}: ${additions}replaced ${writePlan.replaced.join(', ')}`
          );
        } else if (writePlan.skipped.length > 0) {
          success(
            `${agent.displayName}: added ${writePlan.added.join(', ')} (skipped: ${writePlan.skipped.join(', ')})`
          );
        } else {
          success(`${agent.displayName}: ${result.path}`);
        }
        successCount++;
      } else {
        addFailedWrites(writePlan.toWrite, agentType);
        error(`${agent.displayName}: ${result.error}`);
        failCount++;
      }
    }
  }

  console.log();
  if (successCount > 0) {
    success(`Added to ${successCount} agent(s)`);
  }
  if (failCount > 0) {
    error(`Failed for ${failCount} agent(s)`);
  }

  // Show summary of skipped servers
  if (allSkippedServers.size > 0) {
    console.log();
    warn(`Skipped ${allSkippedServers.size} existing server(s):`);
    for (const [serverName, agentNames] of allSkippedServers) {
      console.log(`  ${DIM}${serverName}${RESET} → ${agentNames.join(', ')}`);
    }
    console.log(`\n${DIM}Use 'mcpcm update' to modify existing servers.${RESET}`);
  }

  const telemetryPayloads = buildAddTelemetryPayloads(
    successfulWritesByServer,
    mcpConfig,
    !options.workspace
  );

  if (options.verbose && failedWritesByServer.size > 0) {
    for (const [serverName, agentTypes] of failedWritesByServer) {
      verbose(
        `Skipped telemetry for failed writes: ${serverName} -> ${[...agentTypes].join(',')}`,
        true
      );
    }
  }

  if (telemetryPayloads.length === 0) {
    return;
  }

  try {
    const telemetryResult = await sendIngestTelemetryBatch(telemetryPayloads, {
      verbose: options.verbose,
    });

    if (telemetryResult.failed > 0) {
      const details = telemetryResult.errors.length > 0 ? ` (${telemetryResult.errors[0]})` : '';
      warn(
        `Telemetry upload partially failed: ${telemetryResult.failed}/${telemetryResult.sent}${details}`
      );
    } else if (telemetryResult.skipped > 0) {
      warn('Telemetry upload skipped: MCPPCM_SERVER_URL is not configured.');
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error';
    warn(`Telemetry upload failed: ${detail}`);
  }
}
