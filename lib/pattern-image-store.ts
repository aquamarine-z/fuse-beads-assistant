const PATTERN_IMAGE_DB_NAME = "fuse-pattern-images";
const PATTERN_IMAGE_STORE_NAME = "images";
const PATTERN_IMAGE_DB_VERSION = 1;
const PATTERN_IMAGE_MEMORY_CACHE_KEY = "__fusePatternImageCache";

type ImageRecord = {
  key: string;
  dataUrl: string;
  updatedAt: number;
};

declare global {
  interface Window {
    [PATTERN_IMAGE_MEMORY_CACHE_KEY]?: Record<string, string>;
  }
}

function getPatternImageMemoryCache() {
  if (!window[PATTERN_IMAGE_MEMORY_CACHE_KEY]) {
    window[PATTERN_IMAGE_MEMORY_CACHE_KEY] = {};
  }

  return window[PATTERN_IMAGE_MEMORY_CACHE_KEY];
}

function openPatternImageDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(
      PATTERN_IMAGE_DB_NAME,
      PATTERN_IMAGE_DB_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(PATTERN_IMAGE_STORE_NAME)) {
        database.createObjectStore(PATTERN_IMAGE_STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePatternImageToIndexedDb(key: string, dataUrl: string) {
  getPatternImageMemoryCache()[key] = dataUrl;
  const database = await openPatternImageDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(PATTERN_IMAGE_STORE_NAME, "readwrite");
    const store = transaction.objectStore(PATTERN_IMAGE_STORE_NAME);

    store.put({
      key,
      dataUrl,
      updatedAt: Date.now(),
    } satisfies ImageRecord);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

export async function readPatternImageFromIndexedDb(key: string) {
  const cachedImage = getPatternImageMemoryCache()[key];

  if (cachedImage) {
    return cachedImage;
  }

  const database = await openPatternImageDatabase();

  return new Promise<string | null>((resolve, reject) => {
    const transaction = database.transaction(PATTERN_IMAGE_STORE_NAME, "readonly");
    const store = transaction.objectStore(PATTERN_IMAGE_STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const record = request.result as ImageRecord | undefined;
      if (record?.dataUrl) {
        getPatternImageMemoryCache()[key] = record.dataUrl;
      }
      resolve(record?.dataUrl ?? null);
    };
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => {
      database.close();
    };
    transaction.onerror = () => {
      database.close();
    };
    transaction.onabort = () => {
      database.close();
    };
  });
}
