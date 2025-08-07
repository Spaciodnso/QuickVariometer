
import { openDB, IDBPDatabase } from 'idb';
import { SavedFlight } from '../types';

const DB_NAME = 'VarioPWADatabase';
const STORE_NAME = 'flights';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const saveFlight = async (flight: SavedFlight): Promise<void> => {
  const db = await getDb();
  await db.put(STORE_NAME, flight);
};

export const getAllFlights = async (): Promise<SavedFlight[]> => {
  const db = await getDb();
  const flights = await db.getAll(STORE_NAME);
  // Sort by start time, newest first
  return flights.sort((a, b) => b.startTime - a.startTime);
};

export const getFlightById = async (id: string): Promise<SavedFlight | undefined> => {
  const db = await getDb();
  return db.get(STORE_NAME, id);
};

export const deleteFlight = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
};
