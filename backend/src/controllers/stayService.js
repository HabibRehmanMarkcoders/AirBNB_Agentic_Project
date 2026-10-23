import mongoose from 'mongoose'
import StayNight from '../models/stayNightModel.js'

const HOLD_MS = 15 * 60 * 1000
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function parseYmd(dateStr) {
  if (!DATE_RE.test(dateStr)) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null
  }
  return dt
}

function formatYmd(dt) {
  const y = dt.getUTCFullYear()
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Expand [check_in, check_out) into night date strings. */
export function expandNights(checkIn, checkOut) {
  const start = parseYmd(checkIn)
  const end = parseYmd(checkOut)
  if (!start || !end) {
    return { error: 'check_in and check_out must be YYYY-MM-DD.' }
  }
  if (end <= start) {
    return { error: 'check_out must be after check_in.' }
  }

  const nights = []
  const cursor = new Date(start)
  while (cursor < end) {
    nights.push(formatYmd(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  if (nights.length === 0) {
    return { error: 'Date range must include at least one night.' }
  }

  return { nights }
}

function isActiveBlock(doc, now) {
  if (doc.state === 'booked') return true
  if (doc.state === 'held') {
    if (!doc.expiresAt) return true
    return new Date(doc.expiresAt) > now
  }
  return false
}

/**
 * Read stay_nights for a listing/date range.
 * Returns which nights are free vs blocked (booked or active hold).
 */
export async function checkStayAvailability({
  listing_id,
  check_in,
  check_out,
}) {
  if (!listing_id) {
    return { error: 'listing_id is required.' }
  }

  const expanded = expandNights(check_in, check_out)
  if (expanded.error) return { error: expanded.error }

  const { nights } = expanded
  const now = new Date()

  const docs = await StayNight.find({
    listingId: String(listing_id),
    date: { $in: nights },
  }).lean()

  const blocked = []
  for (const doc of docs) {
    if (isActiveBlock(doc, now)) {
      blocked.push({ date: doc.date, state: doc.state })
    }
  }

  blocked.sort((a, b) => a.date.localeCompare(b.date))

  return {
    listing_id: String(listing_id),
    check_in,
    check_out,
    nights,
    available: blocked.length === 0,
    blocked,
  }
}

/**
 * Soft-hold nights for 15 minutes. Requires authenticated userId (injected).
 */
export async function holdStayNights({
  listing_id,
  check_in,
  check_out,
  userId,
}) {
  if (!userId) {
    return { error: 'Authentication required to hold nights.' }
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { error: 'Invalid userId.' }
  }

  const availability = await checkStayAvailability({
    listing_id,
    check_in,
    check_out,
  })

  if (availability.error) return availability
  if (!availability.available) {
    return {
      error: 'Some nights are not available.',
      listing_id: availability.listing_id,
      nights: availability.nights,
      blocked: availability.blocked,
      available: false,
    }
  }

  const holdId = new mongoose.Types.ObjectId()
  const expiresAt = new Date(Date.now() + HOLD_MS)
  const uid = new mongoose.Types.ObjectId(userId)

  const docs = availability.nights.map((date) => ({
    listingId: String(listing_id),
    date,
    bookingId: holdId,
    userId: uid,
    state: 'held',
    expiresAt,
  }))

  try {
    await StayNight.insertMany(docs, { ordered: true })
  } catch (err) {
    if (err?.code === 11000) {
      return {
        error: 'Hold failed due to a concurrent reservation. Please check availability again.',
        available: false,
      }
    }
    throw err
  }

  return {
    hold_id: holdId.toString(),
    listing_id: String(listing_id),
    nights: availability.nights,
    expires_at: expiresAt.toISOString(),
    state: 'held',
  }
}
