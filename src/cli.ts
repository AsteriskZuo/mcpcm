#!/usr/bin/env node

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { runAdd, parseAddOptions } from './commands/add.js';
import { runDel, parseDelOptions } from './commands/del.js';
import { runList, parseListOptions } from './commands/list.js';
import { runFind } from './commands/find.js';
import { runSync, parseSyncOptions } from './commands/sync.js';
import { runUpdate, parseUpdateOptions } from './commands/update.js';
import { getAllAgentTypes } from './agents.js';
import { RESET, BOLD, DIM, TEXT } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
  } catch {
    return '1.0.0';
  }
}

const VERSION = getVersion();

const LOGO_LINES = [
  '███╗   ███╗ ██████╗██████╗  ██████╗███╗   ███╗',
  '████╗ ████║██╔════╝██╔══██╗██╔════╝████╗ ████║',
  '██╔████╔██║██║     ██████╔╝██║     ██╔████╔██║',
  '██║╚██╔╝██║██║     ██╔═══╝ ██║     ██║╚██╔╝██║',
  '██║ ╚═╝ ██║╚██████╗██║     ╚██████╗██║ ╚═╝ ██║',
  '╚═╝     ╚═╝ ╚═════╝╚═╝      ╚═════╝╚═╝     ╚═╝',
];

const GRAYS = [
  '\x1b[38;5;250m',
  '\x1b[38;5;248m',
  '\x1b[38;5;245m',
  '\x1b[38;5;243m',
  '\x1b[38;5;240m',
  '\x1b[38;5;238m',
];

function showLogo(): void {
  console.log();
  LOGO_LINES.forEach((line, i) => {
    console.log(`${GRAYS[i]}${line}${RESET}`);
  });
}

function showBanner(): void {
  showLogo();
  console.log();
  console.log(
    `${DIM}MCP Configuration Manager - Manage MCP server configuration across AI Agents${RESET}`
  );
  console.log();
  console.log(`  ${DIM}$${RESET} ${TEXT}mcpcm add${RESET}     ${DIM}Add MCP server config${RESET}`);
  console.log(
    `  ${DIM}$${RESET} ${TEXT}mcpcm del${RESET}     ${DIM}Delete MCP server config${RESET}`
  );
  console.log(`  ${DIM}$${RESET} ${TEXT}mcpcm list${RESET}    ${DIM}List all MCP configs${RESET}`);
  console.log(`  ${DIM}$${RESET} ${TEXT}mcpcm find${RESET}    ${DIM}Find MCP server${RESET}`);
  console.log(
    `  ${DIM}$${RESET} ${TEXT}mcpcm sync${RESET}    ${DIM}Sync configs between agents${RESET}`
  );
  console.log();
  console.log(`${DIM}Run${RESET} mcpcm --help ${DIM}for more info${RESET}`);
  console.log();
}

function showHelp(): void {
  const agentList = getAllAgentTypes().join(', ');

  console.log(`
${BOLD}Usage:${RESET} mcpcm <command> [options]

${BOLD}Commands:${RESET}
  add <json>          Add MCP server config from JSON string
  add --file <path>   Add MCP server config from file
  update              Update MCP server config (same as add)
  del <name>          Delete MCP server by name
  list                List all MCP configurations
  find <name>         Find where an MCP server is configured
  sync                Sync configs from one agent to others

${BOLD}Target Options:${RESET}
  -a, --agent <name>  Target specific agent(s)
  -g, --global        Target all installed agents (global configs)
  -w, --workspace     Target project-level configs

${BOLD}Add/Update Options:${RESET}
  -f, --file <path>   Read config from JSON/TOML file
  -r, --replace       Replace configs instead of merging

${BOLD}Sync Options:${RESET}
  --from <agent>      Source agent to sync from
  --to <agent>        Target agent(s) to sync to
  --to-all            Sync to all installed agents

${BOLD}Other Options:${RESET}
  -v, --verbose       Show detailed output
  -h, --help          Show this help message
  --version           Show version number

${BOLD}Supported Agents:${RESET}
  ${DIM}${agentList}${RESET}

${BOLD}Examples:${RESET}
  ${DIM}$${RESET} mcpcm add '{"mcpServers":{"my-server":{"command":"node","args":["/path/to/server"]}}}' --agent cursor
  ${DIM}$${RESET} mcpcm add --file mcp.json --global
  ${DIM}$${RESET} mcpcm del my-server --agent cursor
  ${DIM}$${RESET} mcpcm list --global
  ${DIM}$${RESET} mcpcm find my-server
  ${DIM}$${RESET} mcpcm sync --from cursor --to antigravity claude-code
  ${DIM}$${RESET} mcpcm sync --from cursor --to-all
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showBanner();
    return;
  }

  const command = args[0];
  const restArgs = args.slice(1);

  switch (command) {
    case 'add':
    case 'a': {
      showLogo();
      console.log();
      const { input, options } = parseAddOptions(restArgs);
      await runAdd(input, options);
      break;
    }
    case 'update':
    case 'u': {
      showLogo();
      console.log();
      const { input, options } = parseUpdateOptions(restArgs);
      await runUpdate(input, options);
      break;
    }
    case 'del':
    case 'delete':
    case 'd': {
      showLogo();
      console.log();
      const { serverNames, options } = parseDelOptions(restArgs);
      await runDel(serverNames, options);
      break;
    }
    case 'list':
    case 'ls':
    case 'l': {
      showLogo();
      console.log();
      const options = parseListOptions(restArgs);
      await runList(options);
      break;
    }
    case 'find':
    case 'search':
    case 'f': {
      showLogo();
      await runFind(restArgs);
      break;
    }
    case 'sync':
    case 's': {
      showLogo();
      console.log();
      const options = parseSyncOptions(restArgs);
      if (options) {
        await runSync(options);
      }
      break;
    }
    case '--help':
    case '-h':
    case 'help':
      showHelp();
      break;
    case '--version':
    case '-v':
      console.log(VERSION);
      break;
    default:
      console.log(`Unknown command: ${command}`);
      console.log(`Run ${BOLD}mcpcm --help${RESET} for usage.`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
