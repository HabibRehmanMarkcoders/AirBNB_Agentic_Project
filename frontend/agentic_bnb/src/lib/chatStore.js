const DB_PREFIX = 'agentic_bnb_chats'
const DB_VERSION = 1
const STORE_NAME = 'chats'
const ACTIVE_ID_PREFIX = 'agentic_bnb_active_chat_id'

function requireUserId(userId) {
  if (!userId) {
    throw new Error('userId is required for chat storage')
  }
  return String(userId)
}

function dbNameFor(userId) {
  return `${DB_PREFIX}__${requireUserId(userId)}`
}

function activeIdKeyFor(userId) {
  return `${ACTIVE_ID_PREFIX}__${requireUserId(userId)}`
}

function openDb(userId) {
  const name = dbNameFor(userId)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'))
  })
}

export async function loadAll(userId) {
  const db = await openDb(userId)

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const chats = Array.isArray(request.result) ? request.result : []
      chats.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      resolve(chats)
    }
    request.onerror = () => reject(request.error || new Error('Failed to load chats'))

    tx.oncomplete = () => db.close()
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('IndexedDB read failed'))
    }
  })
}

export async function saveAll(userId, chats) {
  const toSave = (Array.isArray(chats) ? chats : []).filter(
    (chat) => chat?.id && Array.isArray(chat.messages) && chat.messages.length > 0,
  )

  const db = await openDb(userId)

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    store.clear()
    for (const chat of toSave) {
      store.put({ ...chat, userId: requireUserId(userId) })
    }

    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('IndexedDB save failed'))
    }
    tx.onabort = () => {
      db.close()
      reject(tx.error || new Error('IndexedDB save aborted'))
    }
  })
}

export async function upsert(userId, chat) {
  if (!chat?.id) return
  if (!Array.isArray(chat.messages) || chat.messages.length === 0) return

  const db = await openDb(userId)

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put({ ...chat, userId: requireUserId(userId) })

    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error || new Error('IndexedDB upsert failed'))
    }
  })
}

export function getActiveId(userId) {
  try {
    return localStorage.getItem(activeIdKeyFor(userId))
  } catch {
    return null
  }
}

export function setActiveId(userId, id) {
  try {
    const key = activeIdKeyFor(userId)
    if (!id) localStorage.removeItem(key)
    else localStorage.setItem(key, id)
  } catch {
    // ignore quota / private mode errors
  }
}
