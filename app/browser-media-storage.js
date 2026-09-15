const DB_NAME = "weezy-browser-media";
const STORE_NAME = "temporary-editor";
const VIDEO_KEY = "active-video";
const PROJECT_KEY = "active-project";
const OPFS_FILE = "weezy-active-video";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readRecord(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    request.onsuccess = () => { db.close(); resolve(request.result || null); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}

async function writeRecord(key, value) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

async function deleteRecord(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(key);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => { db.close(); reject(transaction.error); };
  });
}

export async function browserStorageInfo() {
  if (!navigator.storage?.estimate) return null;
  await navigator.storage.persist?.().catch(() => false);
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota, available: Math.max(0, quota - usage) };
}

export async function saveTemporaryVideo(file) {
  const info = await browserStorageInfo();
  if (info && info.available < file.size * 1.08) throw new Error("storage-full");
  const metadata = { name: file.name, type: file.type, lastModified: file.lastModified, size: file.size, savedAt: Date.now() };

  if (navigator.storage?.getDirectory) {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(OPFS_FILE, { create: true });
    const writable = await handle.createWritable();
    await writable.write(file);
    await writable.close();
    await writeRecord(VIDEO_KEY, { ...metadata, backend: "opfs" });
  } else {
    await writeRecord(VIDEO_KEY, { ...metadata, backend: "indexeddb", blob: file });
  }
  return browserStorageInfo();
}

export async function loadTemporaryVideo() {
  const record = await readRecord(VIDEO_KEY);
  if (!record) return null;
  let blob = record.blob;
  if (record.backend === "opfs") {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(OPFS_FILE);
    blob = await handle.getFile();
  }
  if (!blob) return null;
  return new File([blob], record.name || "video-temporario", { type: record.type || blob.type, lastModified: record.lastModified || Date.now() });
}

export async function saveTemporaryProject(project) {
  await writeRecord(PROJECT_KEY, { ...project, savedAt: Date.now() });
}

export async function loadTemporaryProject() {
  return readRecord(PROJECT_KEY);
}

export async function clearTemporaryEditor() {
  const record = await readRecord(VIDEO_KEY).catch(() => null);
  if (record?.backend === "opfs" && navigator.storage?.getDirectory) {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(OPFS_FILE).catch(() => {});
  }
  await Promise.all([deleteRecord(VIDEO_KEY), deleteRecord(PROJECT_KEY)]);
}
