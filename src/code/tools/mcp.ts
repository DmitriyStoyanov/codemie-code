import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export class MCPTools {
  private mcpClient: MultiServerMCPClient | null = null;
  private enabledServers: string[] = [];

  constructor(private rootDir: string) {}

  async initialize(servers?: string[]): Promise<void> {
    // Load MCP server configurations
    const configs = await this.loadMCPConfigs();

    // Filter enabled servers
    const serversToUse = servers || Object.keys(configs);
    this.enabledServers = serversToUse;

    // Initialize MCP client with error handling for individual servers
    const serverConfigs: Record<string, any> = {};
    const failedServers: string[] = [];

    for (const serverName of serversToUse) {
      if (configs[serverName]) {
        serverConfigs[serverName] = configs[serverName];
      } else {
        failedServers.push(serverName);
        console.warn(`MCP server "${serverName}" not found in configuration`);
      }
    }

    if (Object.keys(serverConfigs).length > 0) {
      this.mcpClient = new MultiServerMCPClient(serverConfigs);
      // Note: MultiServerMCPClient connects automatically when getting tools
    }

    // Log failed servers for debugging
    if (failedServers.length > 0) {
      console.warn(`Skipped ${failedServers.length} MCP servers: ${failedServers.join(', ')}`);
    }
  }

  async getTools(): Promise<StructuredTool[]> {
    if (!this.mcpClient) {
      return [];
    }

    try {
      // Get tools from MCP client
      const mcpTools = await this.mcpClient.getTools();

      // Wrap MCP tools with metadata
      return mcpTools.map((tool: any) => new WrappedMCPTool(tool));
    } catch (error: any) {
      console.warn(`Failed to load MCP tools: ${error.message}`);
      return [];
    }
  }

  private async loadMCPConfigs(): Promise<Record<string, any>> {
    const configs: Record<string, any> = {};
    let hasGlobalServers = false;

    // Load from global config (~/.codemie/config.json)
    const globalConfigPath = path.join(os.homedir(), '.codemie', 'config.json');
    try {
      const globalConfig = JSON.parse(await fs.readFile(globalConfigPath, 'utf-8'));
      if (globalConfig.mcpServers && Object.keys(globalConfig.mcpServers).length > 0) {
        Object.assign(configs, globalConfig.mcpServers);
        hasGlobalServers = true;
      }
    } catch (error) {
      // No global config
    }

    // Load from bundled servers.json ONLY if no global servers configured
    // This prevents loading bundled servers that require environment variables
    if (!hasGlobalServers) {
      const bundledPath = path.join(__dirname, '../../../mcp/servers.json');
      try {
        const bundled = JSON.parse(await fs.readFile(bundledPath, 'utf-8'));
        if (bundled.mcpServers) {
          // Global config takes precedence
          for (const [name, config] of Object.entries(bundled.mcpServers)) {
            if (!configs[name]) {
              configs[name] = config;
            }
          }
        }
      } catch (error) {
        // No bundled config
      }
    }

    // Inject environment variables into configs
    for (const config of Object.values(configs) as any[]) {
      if (config.env) {
        for (const [key, value] of Object.entries(config.env)) {
          if (typeof value === 'string' && value.includes('${')) {
            config.env[key] = this.interpolateEnvVars(value);
          }
        }
      }
    }

    return configs;
  }

  private interpolateEnvVars(value: string): string {
    return value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
      return process.env[varName] || '';
    });
  }

  async dispose(): Promise<void> {
    if (this.mcpClient) {
      try {
        await this.mcpClient.close();
      } catch (error: any) {
        console.warn(`Error closing MCP client: ${error.message}`);
      }
    }
  }
}

class WrappedMCPTool extends StructuredTool {
  name: string;
  description: string;
  schema: z.ZodObject<any>;

  constructor(private mcpTool: any) {
    super();
    this.name = `mcp_${this.mcpTool.name}`;
    this.description = `[MCP Tool] ${this.mcpTool.description}`;
    // LangChain MCP tools already have a 'schema' property with the JSON schema
    this.schema = this.convertSchema(this.mcpTool.schema);
  }

  async _call(inputs: any): Promise<string> {
    try {
      const result = await this.mcpTool.invoke(inputs);
      // LangChain MCP tools return results as strings already
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error: any) {
      return `MCP Error: ${error.message}`;
    }
  }

  private convertSchema(mcpSchema: any): z.ZodObject<any> {
    const shape: Record<string, z.ZodTypeAny> = {};

    if (mcpSchema?.properties) {
      for (const [key, prop] of Object.entries(mcpSchema.properties as Record<string, any>)) {
        if (typeof prop === 'object' && prop !== null) {
          let zodType: z.ZodTypeAny;

          if (prop.type === 'string') {
            zodType = z.string();
          } else if (prop.type === 'number' || prop.type === 'integer') {
            zodType = z.number();
          } else if (prop.type === 'boolean') {
            zodType = z.boolean();
          } else if (prop.type === 'array') {
            zodType = z.array(z.any());
          } else if (prop.type === 'object') {
            zodType = z.object({}).passthrough();
          } else {
            zodType = z.any();
          }

          // Add description if available
          if (prop.description) {
            zodType = zodType.describe(prop.description);
          }

          // Make optional if not required
          if (mcpSchema.required && !mcpSchema.required.includes(key)) {
            zodType = zodType.optional();
          }

          shape[key] = zodType;
        }
      }
    }

    return z.object(shape);
  }
}
