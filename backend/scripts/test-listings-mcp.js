import 'dotenv/config'
import mongoose from 'mongoose'
import {
  callMcpTool,
  closeMcpClient,
  getGeminiToolsFromMcp,
  getMcpClient,
} from '../src/controllers/mcpClient.js'
import StayNight from '../src/models/stayNightModel.js'

await mongoose.connect(process.env.MONGO_URI)
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

  const listingId = sample.listings?.[0]?.id || 'test-listing-hold'
  const checkIn = '2099-06-01'
  const checkOut = '2099-06-04'
  const userId = new mongoose.Types.ObjectId().toString()

  // Clean any leftover test holds for this far-future range.
  await StayNight.deleteMany({
    listingId: String(listingId),
    date: { $in: ['2099-06-01', '2099-06-02', '2099-06-03'] },
  })

  const avail = await callMcpTool('check_stay_availability', {
    listing_id: listingId,
    check_in: checkIn,
    check_out: checkOut,
  })
  console.log('availability:', {
    available: avail.available,
    nights: avail.nights,
    blocked: avail.blocked,
  })

  const hold = await callMcpTool('hold_stay_nights', {
    listing_id: listingId,
    check_in: checkIn,
    check_out: checkOut,
    userId,
  })
  console.log('hold:', {
    hold_id: hold.hold_id,
    state: hold.state,
    nights: hold.nights,
    error: hold.error,
  })

  const conflict = await callMcpTool('hold_stay_nights', {
    listing_id: listingId,
    check_in: checkIn,
    check_out: checkOut,
    userId: new mongoose.Types.ObjectId().toString(),
  })
  console.log('second hold (expect conflict):', {
    available: conflict.available,
    error: conflict.error,
    blocked: conflict.blocked,
  })

  // Expire holds and confirm nights become free again.
  await StayNight.updateMany(
    { bookingId: hold.hold_id },
    { $set: { expiresAt: new Date(Date.now() - 60_000) } },
  )

  const afterExpire = await callMcpTool('check_stay_availability', {
    listing_id: listingId,
    check_in: checkIn,
    check_out: checkOut,
  })
  console.log('after expire:', {
    available: afterExpire.available,
    blocked: afterExpire.blocked,
  })

  await StayNight.deleteMany({ bookingId: hold.hold_id })
} finally {
  await closeMcpClient()
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect()
  }
}
