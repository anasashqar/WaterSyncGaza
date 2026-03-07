/**
 * WaterSync — IndexedDB Database Service
 * خدمة قاعدة البيانات المحلية
 */
import { DB_NAME, DB_VERSION, STORES } from '@/lib/constants/database'

// ============================================
// Database Connection
// ============================================

let db: IDBDatabase | null = null

/** Initialize the IndexedDB database */
export function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      console.log('[OK] قاعدة البيانات جاهزة')
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      if (!database.objectStoreNames.contains(STORES.stations)) {
        database.createObjectStore(STORES.stations, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(STORES.points)) {
        database.createObjectStore(STORES.points, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(STORES.trips)) {
        database.createObjectStore(STORES.trips, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(STORES.zones)) {
        database.createObjectStore(STORES.zones, { keyPath: 'id' })
      }
      if (!database.objectStoreNames.contains(STORES.executions)) {
        const execStore = database.createObjectStore(STORES.executions, { keyPath: 'id' })
        execStore.createIndex('date', 'date')
        execStore.createIndex('tripId', 'tripId')
      }
      if (!database.objectStoreNames.contains(STORES.history)) {
        const histStore = database.createObjectStore(STORES.history, { keyPath: 'id' })
        histStore.createIndex('date', 'date')
        histStore.createIndex('pointId', 'pointId')
      }
      if (!database.objectStoreNames.contains(STORES.deliveries)) {
        const delStore = database.createObjectStore(STORES.deliveries, { keyPath: 'id' })
        delStore.createIndex('pointId', 'pointId')
        delStore.createIndex('institutionId', 'institutionId')
      }
    }
  })
}

/** Get the current database connection, initializing if needed */
export async function getDB(): Promise<IDBDatabase> {
  if (db) return db
  return initDatabase()
}

// ============================================
// Generic CRUD Operations
// ============================================

/** Add or update a record in a store */
export async function dbAdd<T>(storeName: string, data: T): Promise<IDBValidKey> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.put(data)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Get a single record by ID */
export async function dbGet<T>(storeName: string, id: string): Promise<T | undefined> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

/** Get all records from a store */
export async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const store = transaction.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

/** Delete a record by ID */
export async function dbDelete(storeName: string, id: string): Promise<void> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/** Clear all records from a store */
export async function dbClear(storeName: string): Promise<void> {
  const database = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite')
    const store = transaction.objectStore(storeName)
    const request = store.clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}
