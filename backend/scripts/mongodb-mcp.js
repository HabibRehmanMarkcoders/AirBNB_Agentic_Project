import 'dotenv/config'
import { Client } from '@modelcontextprotocol/client'
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio'

export async function connectMongoMCP() {
  const connectionString = process.env.MDB_MCP_CONNECTION_STRING || process.env.MONGO_URI || process.env.MONGODB_URI

  if (!connectionString) {
    throw new Error('Set MONGO_URI (or MONGODB_URI / MDB_MCP_CONNECTION_STRING) in .env')
  }

  const client = new Client({
    name: 'my-ai-app',
    version: '1.0.0',
  })

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', 'mongodb-mcp-server@latest', '--readOnly'],
    env: {
      ...process.env,
      MDB_MCP_CONNECTION_STRING: connectionString,
    },
  })

  await client.connect(transport)

  return client
}
