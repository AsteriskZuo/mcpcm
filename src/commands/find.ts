import type { FindResult, AgentType } from '../types.js';
import { agents, getAllAgentTypes } from '../agents.js';
import { readGlobalConfig, readProjectConfig } from '../config-reader.js';
import { success, info, RESET, BOLD, DIM, TEXT, CYAN, GREEN } from '../utils.js';

/**
 * Execute find command
 */
export async function runFind(args: string[]): Promise<void> {
  const serverName = args[0];
  const verbose = args.includes('--verbose') || args.includes('-v');

  if (!serverName) {
    info('Usage: mcpm find <server-name>');
    console.log(`\n${DIM}Example:${RESET}`);
    console.log(`  mcpm find easeim`);
    return;
  }

  console.log(`\n${DIM}Searching for "${serverName}"...${RESET}\n`);

  const results: FindResult[] = [];

  for (const agentType of getAllAgentTypes()) {
    const agent = agents[agentType];

    // Check global config
    if (agent.globalConfigPath) {
      const globalConfig = readGlobalConfig(agentType, verbose);
      if (globalConfig.config?.mcpServers[serverName]) {
        results.push({
          agent: agentType,
          scope: 'global',
          path: globalConfig.path,
          config: globalConfig.config.mcpServers[serverName],
        });
      }
    }

    // Check project config
    if (agent.projectConfigPath) {
      const projectConfig = readProjectConfig(agentType, process.cwd(), verbose);
      if (projectConfig.config?.mcpServers[serverName]) {
        results.push({
          agent: agentType,
          scope: 'project',
          path: projectConfig.path,
          config: projectConfig.config.mcpServers[serverName],
        });
      }
    }
  }

  if (results.length === 0) {
    info(`"${serverName}" not found in any MCP configuration`);
    return;
  }

  console.log(`${GREEN}✓${RESET} ${BOLD}${serverName}${RESET} found in:\n`);

  for (const result of results) {
    const agent = agents[result.agent];
    const scopeLabel = result.scope === 'global' ? 'global' : 'project';
    console.log(
      `  ${CYAN}${agent.displayName}${RESET} (${scopeLabel}): ${DIM}${result.path}${RESET}`
    );

    if (verbose) {
      const config = result.config;
      console.log(`    ${DIM}command:${RESET} ${config.command}`);
      if (config.args && config.args.length > 0) {
        console.log(`    ${DIM}args:${RESET} ${config.args.join(' ')}`);
      }
      if (config.env) {
        console.log(`    ${DIM}env:${RESET} ${JSON.stringify(config.env)}`);
      }
    }
  }

  console.log();
}
