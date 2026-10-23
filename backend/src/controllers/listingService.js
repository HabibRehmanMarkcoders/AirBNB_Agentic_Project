import mongoose from 'mongoose'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decimalToNumber(value) {
  if (value == null) return null
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  if (typeof value === 'object' && value.$numberDecimal != null) {
    return Number(value.$numberDecimal)
  }
  if (typeof value?.toString === 'function') {
    const n = Number(value.toString())
    return Number.isFinite(n) ? n : null
  }
  return null
}

const BRIEF_PROJECTION = {
  name: 1,
  summary: 1,
  property_type: 1,
  room_type: 1,
  accommodates: 1,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  minimum_nights: 1,
  maximum_nights: 1,
  price: 1,
  cleaning_fee: 1,
  extra_people: 1,
  guests_included: 1,
  address: 1,
  listing_url: 1,
}

function formatListing(doc) {
  const price = decimalToNumber(doc.price)
  const cleaningFee = decimalToNumber(doc.cleaning_fee)
  const extraPeople = decimalToNumber(doc.extra_people)
  const guestsIncluded = decimalToNumber(doc.guests_included)

  return {
    id: String(doc._id),
    name: doc.name || 'Unnamed listing',
    summary: doc.summary || '',
    propertyType: doc.property_type || '',
    roomType: doc.room_type || '',
    accommodates: doc.accommodates ?? null,
    bedrooms: doc.bedrooms ?? null,
    beds: doc.beds ?? null,
    bathrooms: doc.bathrooms ?? null,
    minimumNights: doc.minimum_nights ?? null,
    maximumNights: doc.maximum_nights ?? null,
    pricePerNight: price,
    cleaningFee,
    extraGuestFeePerNight: extraPeople,
    guestsIncluded,
    city: doc.address?.market || doc.address?.suburb || doc.address?.country || null,
    listingUrl: doc.listing_url || null,
  }
}

// ---------------------------------------------------------------------------
// Tool implementations — called by the Gemini agentic loop
// ---------------------------------------------------------------------------

/**
 * Search listings with optional filters.
 * Called by the `search_listings` Gemini tool.
 */
export async function searchListings({
  city,
  property_type,
  min_guests,
  max_price_per_night,
  limit = 5,
} = {}) {
  if (mongoose.connection.readyState !== 1) {
    return { error: 'Database is not connected.', listings: [] }
  }

  const filter = {}

  if (city) {
    const re = { $regex: city, $options: 'i' }
    filter.$or = [
      { 'address.market': re },
      { 'address.suburb': re },
      { 'address.country': re },
    ]
  }

  if (property_type) {
    filter.property_type = { $regex: property_type, $options: 'i' }
  }

  if (min_guests != null) {
    filter.accommodates = { $gte: Number(min_guests) }
  }

  if (max_price_per_night != null) {
    filter.price = { $lte: Number(max_price_per_night) }
  }

  const cap = Math.min(Number(limit) || 5, 10)

  const docs = await mongoose.connection.db
    .collection('AirBnbData')
    .find(filter)
    .project(BRIEF_PROJECTION)
    .limit(cap)
    .toArray()

  return { listings: docs.map(formatListing), count: docs.length }
}

/**
 * Fetch full details for a single listing.
 * Called by the `get_listing_details` Gemini tool.
 */
export async function getListingById(listingId) {
  if (mongoose.connection.readyState !== 1) {
    return { error: 'Database is not connected.' }
  }

  let doc = null
  try {
    // AirBnb sample-data _ids are strings, but try ObjectId as a fallback.
    doc = await mongoose.connection.db
      .collection('AirBnbData')
      .findOne({ _id: listingId })

    if (!doc) {
      const { ObjectId } = mongoose.Types
      if (ObjectId.isValid(listingId)) {
        doc = await mongoose.connection.db
          .collection('AirBnbData')
          .findOne({ _id: new ObjectId(listingId) })
      }
    }
  } catch {
    return { error: 'Invalid listing ID format.' }
  }

  if (!doc) {
    return { error: `Listing "${listingId}" not found.` }
  }

  // Return a richer object for the detail view.
  return {
    ...formatListing(doc),
    description: doc.description || '',
    amenities: doc.amenities || [],
    reviewScores: doc.review_scores || null,
    images: doc.images?.picture_url ? [doc.images.picture_url] : [],
  }
}

/**
 * Deterministic stay-cost calculation — keeps money math out of the LLM.
 * Called by the `calculate_stay_cost` Gemini tool.
 */
export function calculateStayCost({
  price_per_night,
  nights,
  cleaning_fee = 0,
  guests = 1,
  guests_included = 1,
  extra_guest_fee_per_night = 0,
}) {
  const pn = Number(price_per_night)
  const n = Number(nights)
  const cf = Number(cleaning_fee) || 0
  const g = Number(guests) || 1
  const gi = Number(guests_included) || 1
  const egf = Number(extra_guest_fee_per_night) || 0

  const extraGuests = Math.max(0, g - gi)
  const accommodationSubtotal = pn * n
  const extraGuestTotal = extraGuests * egf * n
  const total = accommodationSubtotal + cf + extraGuestTotal

  return {
    breakdown: {
      nightly_rate: pn,
      nights: n,
      accommodation_subtotal: accommodationSubtotal,
      cleaning_fee: cf,
      guests: g,
      guests_included: gi,
      extra_guests: extraGuests,
      extra_guest_fee_per_night: egf,
      extra_guest_total: extraGuestTotal,
      total,
    },
  }
}
