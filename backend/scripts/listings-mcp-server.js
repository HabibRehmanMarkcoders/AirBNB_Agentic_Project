/**
 * Custom MCP server for AirBNB listing tools.
 * Talks over stdio. Do not use console.log — it breaks the MCP protocol.
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  searchListings,
  getListingById,
  calculateStayCost,
} from '../src/controllers/listingService.js'
import {
  checkStayAvailability,
  holdStayNights,
} from '../src/controllers/stayService.js'

function ok(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data) }],
  }
}

function fail(message) {
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify({ error: message }) }],
  }
}

const server = new McpServer({
  name: 'airbnb-listings-mcp',
  version: '1.0.0',
})

server.registerTool(
  'search_listings',
  {
    description:
      'Search for available Airbnb listings. Use when the user asks about places to stay, accommodation options, or listing availability.',
    inputSchema: {
      city: z.string().optional().describe('City or area to search in'),
      property_type: z
        .string()
        .optional()
        .describe('Property type filter (e.g. Apartment, House, Loft)'),
      min_guests: z
        .number()
        .int()
        .optional()
        .describe('Minimum number of guests the listing must accommodate'),
      max_price_per_night: z
        .number()
        .optional()
        .describe('Maximum price per night in dollars'),
      limit: z
        .number()
        .int()
        .optional()
        .describe('Maximum number of results to return (default 5, max 10)'),
    },
  },
  async (args) => {
    try {
      return ok(await searchListings(args || {}))
    } catch (err) {
      return fail(err.message || 'search_listings failed')
    }
  },
)

server.registerTool(
  'get_listing_details',
  {
    description:
      'Get the full details of a specific listing by its ID. Use when the user wants more info about a particular listing.',
    inputSchema: {
      listing_id: z.string().describe('The listing ID to look up'),
    },
  },
  async (args) => {
    try {
      return ok(await getListingById(args?.listing_id))
    } catch (err) {
      return fail(err.message || 'get_listing_details failed')
    }
  },
)

server.registerTool(
  'calculate_stay_cost',
  {
    description:
      'Calculate the total cost of a stay. ALWAYS use this tool for price calculations instead of doing math yourself.',
    inputSchema: {
      price_per_night: z.number().describe('Nightly rate in dollars'),
      nights: z.number().int().describe('Number of nights'),
      cleaning_fee: z.number().optional().describe('One-time cleaning fee (default 0)'),
      guests: z.number().int().optional().describe('Number of guests staying'),
      guests_included: z
        .number()
        .int()
        .optional()
        .describe('Number of guests included in the base nightly price'),
      extra_guest_fee_per_night: z
        .number()
        .optional()
        .describe('Extra fee per additional guest per night (default 0)'),
    },
  },
  async (args) => {
    try {
      return ok(calculateStayCost(args || {}))
    } catch (err) {
      return fail(err.message || 'calculate_stay_cost failed')
    }
  },
)

server.registerTool(
  'check_stay_availability',
  {
    description:
      'Check whether a listing is free for a date range. Returns which nights are available or blocked (booked/held). Use before telling the user dates are free, and before holding.',
    inputSchema: {
      listing_id: z.string().describe('Listing ID to check'),
      check_in: z.string().describe('Check-in date YYYY-MM-DD'),
      check_out: z
        .string()
        .describe('Check-out date YYYY-MM-DD (exclusive; last night is the day before)'),
    },
  },
  async (args) => {
    try {
      return ok(await checkStayAvailability(args || {}))
    } catch (err) {
      return fail(err.message || 'check_stay_availability failed')
    }
  },
)

server.registerTool(
  'hold_stay_nights',
  {
    description:
      'Soft-hold nights on a listing for 15 minutes so another guest cannot take them. Only call after the user clearly asks to reserve/hold, and after check_stay_availability shows available. Requires authenticated user.',
    inputSchema: {
      listing_id: z.string().describe('Listing ID to hold'),
      check_in: z.string().describe('Check-in date YYYY-MM-DD'),
      check_out: z
        .string()
        .describe('Check-out date YYYY-MM-DD (exclusive)'),
      userId: z
        .string()
        .optional()
        .describe('Authenticated user id (injected by backend; do not invent)'),
    },
  },
  async (args) => {
    try {
      return ok(await holdStayNights(args || {}))
    } catch (err) {
      return fail(err.message || 'hold_stay_nights failed')
    }
  },
)

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required for listings MCP server')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGO_URI)
  console.error('listings-mcp-server: MongoDB connected')

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('listings-mcp-server: ready on stdio')
}

main().catch((err) => {
  console.error('listings-mcp-server failed:', err.message)
  process.exit(1)
})
