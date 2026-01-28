import type { AgentType, DelOptions } from '../types.js';
import { agents, getAllAgentTypes, detectInstalledAgents, isValidAgentType } from '../agents.js';
import { readGlobalConfig, readProjectConfig } from '../config-reader.js';
import {
  writeGlobalConfig,
  writeProjectConfig,
  removeServersFromConfig,
} from '../config-writer.js';
import { success, error, warn, info, verbose, RESET, DIM } from '../utils.js';

/**
 * Parse del command options
 */
export function parseDelOptions(args: string[]): { serverNames: string[]; options: DelOptions } {
  const options: DelOptions = {};
  const serverNames: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--agent' || arg === '-a') {
      options.agents = [];
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
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (!arg?.startsWith('-')) {
      if (typeof arg === 'string') {
        serverNames.push(arg);
      }
    }
  }

  return { serverNames, options };
}

/**
 * Execute del command
 */
export async function runDel(serverNames: string[], options: DelOptions): Promise<void> {
  verbose('Running del command', options.verbose ?? false);

  if (serverNames.length === 0) {
    error('No server name provided');
    console.log(`\n${DIM}Example:${RESET}`);
    console.log(`  mcpm del my-server --agent cursor`);
    console.log(`  mcpm del my-server --global`);
    return;
  }

  info(`Deleting MCP server(s): ${serverNames.join(', ')}`);

  // Determine target agents
  let targetAgents: AgentType[] = [];

  if (options.agents && options.agents.length > 0) {
    targetAgents = options.agents;
  } else if (options.global) {
    targetAgents = await detectInstalledAgents();
    if (targetAgents.length === 0) {
      warn('No installed agents detected.');
      return;
    }
  } else if (options.workspace) {
    targetAgents = getAllAgentTypes().filter((t) => agents[t].projectConfigPath !== null);
  } else {
    error('Specify target with --agent, --global, or --workspace');
    return;
  }

  let successCount = 0;
  let failCount = 0;
  const allNotFoundServers: Map<string, string[]> = new Map(); // server name -> agent names

  for (const agentType of targetAgents) {
    const agent = agents[agentType];

    if (options.workspace) {
      if (!agent.projectConfigPath) continue;

      const existing = readProjectConfig(agentType, process.cwd(), options.verbose);
      if (!existing.config) continue;

      const existingServers = Object.keys(existing.config.mcpServers || {});

      // Find which servers actually exist
      const toDelete = serverNames.filter((s) => existingServers.includes(s));
      const notFound = serverNames.filter((s) => !existingServers.includes(s));

      // Track not found servers
      for (const nf of notFound) {
        const agents = allNotFoundServers.get(nf) || [];
        agents.push(agent.displayName);
        allNotFoundServers.set(nf, agents);
      }

      // Skip if no servers to delete
      if (toDelete.length === 0) {
        warn(`${agent.displayName}: no matching servers found (skipped)`);
        continue;
      }

      const updated = removeServersFromConfig(existing.config, toDelete);
      const result = writeProjectConfig(
        agentType,
        updated,
        existing.rawContent,
        process.cwd(),
        options.verbose
      );

      if (result.success) {
        if (notFound.length > 0) {
          success(
            `${agent.displayName}: deleted ${toDelete.join(', ')} (not found: ${notFound.join(', ')})`
          );
        } else {
          success(`${agent.displayName}: deleted ${toDelete.join(', ')}`);
        }
        successCount++;
      } else {
        error(`${agent.displayName}: ${result.error}`);
        failCount++;
      }
    } else {
      if (!agent.globalConfigPath) continue;

      const existing = readGlobalConfig(agentType, options.verbose);
      if (!existing.config) continue;

      const existingServers = Object.keys(existing.config.mcpServers || {});

      // Find which servers actually exist
      const toDelete = serverNames.filter((s) => existingServers.includes(s));
      const notFound = serverNames.filter((s) => !existingServers.includes(s));

      // Track not found servers
      for (const nf of notFound) {
        const agents = allNotFoundServers.get(nf) || [];
        agents.push(agent.displayName);
        allNotFoundServers.set(nf, agents);
      }

      // Skip if no servers to delete
      if (toDelete.length === 0) {
        warn(`${agent.displayName}: no matching servers found (skipped)`);
        continue;
      }

      const updated = removeServersFromConfig(existing.config, toDelete);
      const result = writeGlobalConfig(agentType, updated, existing.rawContent, options.verbose);

      if (result.success) {
        if (notFound.length > 0) {
          success(
            `${agent.displayName}: deleted ${toDelete.join(', ')} (not found: ${notFound.join(', ')})`
          );
        } else {
          success(`${agent.displayName}: deleted ${toDelete.join(', ')}`);
        }
        successCount++;
      } else {
        error(`${agent.displayName}: ${result.error}`);
        failCount++;
      }
    }
  }

  console.log();
  if (successCount > 0) {
    success(`Deleted from ${successCount} agent(s)`);
  }
  if (failCount > 0) {
    error(`Failed for ${failCount} agent(s)`);
  }

  // Show summary of not found servers
  if (allNotFoundServers.size > 0) {
    console.log();
    warn(`${allNotFoundServers.size} server(s) not found:`);
    for (const [serverName, agentNames] of allNotFoundServers) {
      console.log(`  ${DIM}${serverName}${RESET} → ${agentNames.join(', ')}`);
    }
  }
}
