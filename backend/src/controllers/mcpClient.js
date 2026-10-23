import path from 'path'
import { fileURLToPath } from 'url'
import { Client } from '@modelcontextprotocol/client'
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SERVER_PATH = path.resolve(__dirname, '../../scripts/listings-mcp-server.js')

let client = null
let connecting = null

function mapJsonTypeToGemini(type) {
  const key = String(type || 'string').toLowerCase()
  const map = {
    string: 'STRING',
    number: 'NUMBER',
    integer: 'INTEGER',
    boolean: 'BOOLEAN',
    object: 'OBJECT',
    array: 'ARRAY',
  }
  return map[key] || 'STRING'
}

/** Convert one MCP tool definition into a Gemini functionDeclaration. */
export function mcpToolToGemini(tool) {
  const schema = tool.inputSchema || {}
  const properties = {}

  for (const [key, def] of Object.entries(schema.properties || {})) {
    properties[key] = {
      type: mapJsonTypeToGemini(def.type),
      description: def.description || '',
    }
  }

  const parameters = {
    type: 'OBJECT',
    properties,
  }

  if (Array.isArray(schema.required) && schema.required.length > 0) {
    parameters.required = schema.required
  }

  return {
    name: tool.name,
    description: tool.description || '',
    parameters,
  }
}

export async function getMcpClient() {
  if (client) return client
  if (connecting) return connecting

  connecting = (async () => {
    const next = new Client({
      name: 'agentic-airbnb-backend',
      version: '1.0.0',
    })

    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [SERVER_PATH],
      env: { ...process.env },
    })

    await next.connect(transport)
    client = next
    connecting = null
    return client
  })()

  try {
    return await connecting
  } catch (err) {
    connecting = null
    throw err
  }
}

/** Discover MCP tools and shape them for Gemini's tools field. */
export async function getGeminiToolsFromMcp() {
  const mcp = await getMcpClient()
  const { tools } = await mcp.listTools()

  if (!Array.isArray(tools) || tools.length === 0) {
    throw new Error('MCP server returned no tools')
  }

  return [
    {
      functionDeclarations: tools.map(mcpToolToGemini),
    },
  ]
}

/** Execute a tool Gemini selected, via the MCP client. */
export async function callMcpTool(name, args = {}) {
  const mcp = await getMcpClient()
  const result = await mcp.callTool({
    name,
    arguments: args && typeof args === 'object' ? args : {},
  })

  const textPart = (result.content || []).find((part) => part.type === 'text')
  const raw = textPart?.text || ''

  let parsed = raw
  try {
    parsed = raw ? JSON.parse(raw) : {}
  } catch {
    parsed = { result: raw }
  }

  if (result.isError) {
    return typeof parsed === 'object' && parsed
      ? parsed
      : { error: String(parsed) }
  }

  return parsed
}

export async function closeMcpClient() {
  if (!client) return
  try {
    await client.close()
  } catch {
    // ignore
  }
  client = null
}
