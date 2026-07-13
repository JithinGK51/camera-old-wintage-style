import { Photo, ScrapbookItem } from "../types";

const DB_NAME = "RetroCamAI_DB";
const DB_VERSION = 1;
const PHOTOS_STORE = "photos";
const SCRAPBOOK_STORE = "scrapbook";

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SCRAPBOOK_STORE)) {
        db.createObjectStore(SCRAPBOOK_STORE, { keyPath: "id" });
      }
    };
  });
}

export async function getPhotosFromDB(): Promise<Photo[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTOS_STORE, "readonly");
      const store = transaction.objectStore(PHOTOS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const photos = request.result as Photo[];
        // Sort descending by timestamp (newest first)
        photos.sort((a, b) => b.timestamp - a.timestamp);
        resolve(photos);
      };

      request.onerror = () => {
        reject(new Error("Failed to fetch photos from database"));
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function addPhotoToDB(photo: Photo): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTOS_STORE, "readwrite");
      const store = transaction.objectStore(PHOTOS_STORE);
      const request = store.add(photo);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to save photo to database"));
      };
    });
  } catch (error) {
    console.error(error);
  }
}

export async function updatePhotoInDB(photo: Photo): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTOS_STORE, "readwrite");
      const store = transaction.objectStore(PHOTOS_STORE);
      const request = store.put(photo);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to update photo in database"));
      };
    });
  } catch (error) {
    console.error(error);
  }
}

export async function deletePhotoFromDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(PHOTOS_STORE, "readwrite");
      const store = transaction.objectStore(PHOTOS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error("Failed to delete photo from database"));
      };
    });
  } catch (error) {
    console.error(error);
  }
}

// Scrapbook placements
export async function getScrapbookItemsFromDB(): Promise<ScrapbookItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SCRAPBOOK_STORE, "readonly");
      const store = transaction.objectStore(SCRAPBOOK_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as ScrapbookItem[]);
      };

      request.onerror = () => {
        reject(new Error("Failed to fetch scrapbook items"));
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function saveScrapbookItemsToDB(items: ScrapbookItem[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(SCRAPBOOK_STORE, "readwrite");
      const store = transaction.objectStore(SCRAPBOOK_STORE);
      
      // Clear current scrapbook items first
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        if (items.length === 0) {
          resolve();
          return;
        }
        
        let completed = 0;
        let failed = false;

        items.forEach((item) => {
          const addReq = store.add(item);
          addReq.onsuccess = () => {
            completed++;
            if (completed === items.length && !failed) {
              resolve();
            }
          };
          addReq.onerror = () => {
            if (!failed) {
              failed = true;
              reject(new Error("Failed to save scrapbook items"));
            }
          };
        });
      };

      clearRequest.onerror = () => {
        reject(new Error("Failed to clear scrapbook store"));
      };
    });
  } catch (error) {
    console.error(error);
  }
}

export async function addPhotoToScrapbookDB(photoId: string): Promise<void> {
  const currentItems = await getScrapbookItemsFromDB();
  const maxZ = currentItems.reduce((max, item) => Math.max(max, item.zIndex), 0);
  const TAPE_COLORS = [
    "rgba(212, 175, 55, 0.5)",
    "rgba(95, 158, 160, 0.5)",
    "rgba(244, 164, 96, 0.5)",
    "rgba(255, 255, 255, 0.45)"
  ];
  const newItem: ScrapbookItem = {
    id: Math.random().toString(36).substring(2, 9),
    photoId: photoId,
    x: 80 + Math.random() * 80,
    y: 100 + Math.random() * 100,
    rotation: (Math.random() - 0.5) * 20,
    scale: 1,
    zIndex: maxZ + 1,
    tapeColor: TAPE_COLORS[Math.floor(Math.random() * TAPE_COLORS.length)]
  };
  currentItems.push(newItem);
  await saveScrapbookItemsToDB(currentItems);
}

