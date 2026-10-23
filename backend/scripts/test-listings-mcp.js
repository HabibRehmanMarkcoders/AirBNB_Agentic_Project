import 'dotenv/config'
import {
  callMcpTool,
  closeMcpClient,
  getGeminiToolsFromMcp,
  getMcpClient,
} from '../src/controllers/mcpClient.js'

const client = await getMcpClient()

try {
  const { tools } = await client.listTools()
  console.log('MCP tools:')
  console.log(tools.map((t) => t.name))

  const geminiTools = await getGeminiToolsFromMcp()
  console.log(
    'Gemini functionDeclarations:',
    geminiTools[0].functionDeclarations.map((f) => f.name),
  )

  const sample = await callMcpTool('search_listings', { limit: 2 })
  console.log('sample search_listings count:', sample.count ?? sample.listings?.length)
} 
finally {
  await closeMcpClient()
}
