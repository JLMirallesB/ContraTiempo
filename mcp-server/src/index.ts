#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerCrudTools } from './crudTools.js';
import { registerScenarioTools } from './scenarioTools.js';
import { registerQueryTools } from './queryTools.js';

const server = new McpServer({
  name: 'contratiempo',
  version: '0.1.0',
});

// Register all tools
registerCrudTools(server);
registerScenarioTools(server);
registerQueryTools(server);

// Start server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
