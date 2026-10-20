import { connectMongoMCP } from './mongodb-mcp.js'

const client = await connectMongoMCP()

try {
  const { tools } = await client.listTools()
  console.log('MongoDB MCP tools:')
  console.log(tools.map((tool) => tool.name))
} finally {
  await client.close()
}
