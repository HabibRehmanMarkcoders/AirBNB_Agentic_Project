import mongoose from 'mongoose'

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

export async function getListingsForChat(limit = 8) {
  if (mongoose.connection.readyState !== 1) {
    return []
  }

  const docs = await mongoose.connection.db
    .collection('AirBnbData')
    .find({})
    .project({
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
    })
    .limit(limit)
    .toArray()

  return docs.map(formatListing)
}

export function buildListingContext(listings) {
  if (!listings.length) {
    return 'LISTING_DATA: none available in the database right now.'
  }

  const lines = listings.map((listing, index) => {
    return [
      `Listing ${index + 1}:`,
      `- id: ${listing.id}`,
      `- name: ${listing.name}`,
      `- city/area: ${listing.city || 'n/a'}`,
      `- accommodates: ${listing.accommodates ?? 'n/a'}`,
      `- bedrooms: ${listing.bedrooms ?? 'n/a'}`,
      `- price_per_night: ${listing.pricePerNight ?? 'n/a'}`,
      `- cleaning_fee: ${listing.cleaningFee ?? 'n/a'}`,
      `- guests_included: ${listing.guestsIncluded ?? 'n/a'}`,
      `- extra_guest_fee_per_night: ${listing.extraGuestFeePerNight ?? 'n/a'}`,
      `- min_nights: ${listing.minimumNights ?? 'n/a'}`,
      `- max_nights: ${listing.maximumNights ?? 'n/a'}`,
      `- url: ${listing.listingUrl || 'n/a'}`,
    ].join('\n')
  })

  return `LISTING_DATA from MongoDB collection AirBnbData:\n\n${lines.join('\n\n')}`
}
