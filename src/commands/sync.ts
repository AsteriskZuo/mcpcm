import type { AgentType, SyncOptions } from '../types.js';
import { agents, detectInstalledAgents, isValidAgentType } from '../agents.js';
import { readGlobalConfig } from '../config-reader.js';
import { writeGlobalConfig, mergeMcpConfigs } from '../config-writer.js';
import { success, error, warn, info, verbose, RESET, DIM } from '../utils.js';

/**
 * Parse sync command options
 */
export function parseSyncOptions(args: string[]): SyncOptions | null {
  let from: AgentType | null = null;
  const to: AgentType[] = [];
  let toAll = false;
  let verboseMode = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--from' || arg === '-f') {
      const agentName = args[++i];
      if (agentName && isValidAgentType(agentName)) {
        from = agentName;
      } else {
        warn(`Unknown agent: ${agentName}`);
      }
    } else if (arg === '--to' || arg === '-t') {
      while (i + 1 < args.length && !args[i + 1]?.startsWith('-')) {
        i++;
        const agentName = args[i];
        if (agentName && isValidAgentType(agentName)) {
          to.push(agentName);
        } else if (agentName) {
          warn(`Unknown agent: ${agentName}`);
        }
      }
    } else if (arg === '--to-all') {
      toAll = true;
    } else if (arg === '--verbose' || arg === '-v') {
      verboseMode = true;
    }
  }

  if (!from) {
    error('Missing --from agent');
    return null;
  }

  return { from, to: to.length > 0 ? to : undefined, toAll, verbose: verboseMode };
}

/**
 * Execute sync command
 */
export async function runSync(options: SyncOptions): Promise<void> {
  verbose('Running sync command', options.verbose ?? false);

  // Read source config
  const sourceConfig = readGlobalConfig(options.from, options.verbose);
  if (!sourceConfig.config || Object.keys(sourceConfig.config.mcpServers).length === 0) {
    error(`No MCP servers found in ${agents[options.from].displayName}'s global config`);
    return;
  }

  info(
    `Syncing ${Object.keys(sourceConfig.config.mcpServers).length} server(s) from ${agents[options.from].displayName}`
  );

  // Determine target agents
  let targetAgents: AgentType[] = [];

  if (options.toAll) {
    targetAgents = await detectInstalledAgents();
    // Remove source agent from targets
    targetAgents = targetAgents.filter((a) => a !== options.from);
  } else if (options.to && options.to.length > 0) {
    targetAgents = options.to.filter((a) => a !== options.from);
  } else {
    error('Specify target with --to or --to-all');
    return;
  }

  if (targetAgents.length === 0) {
    warn('No target agents to sync to');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const agentType of targetAgents) {
    const agent = agents[agentType];

    if (!agent.globalConfigPath) {
      verbose(`${agent.displayName} doesn't support global config`, options.verbose ?? false);
      continue;
    }

    const existing = readGlobalConfig(agentType, options.verbose);
    const merged = mergeMcpConfigs(
      existing.config || { mcpServers: {} },
      sourceConfig.config,
      false // Always merge, don't replace
    );

    const result = writeGlobalConfig(agentType, merged, existing.rawContent, options.verbose);
    if (result.success) {
      success(`${agent.displayName}: ${result.path}`);
      successCount++;
    } else {
      error(`${agent.displayName}: ${result.error}`);
      failCount++;
    }
  }

  console.log();
  if (successCount > 0) {
    success(`Synced to ${successCount} agent(s)`);
  }
  if (failCount > 0) {
    error(`Failed for ${failCount} agent(s)`);
  }
}
