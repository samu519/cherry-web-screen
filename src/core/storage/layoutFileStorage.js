/* =========================================================
   CHERRY — LAYOUT FILE STORAGE
   Persistencia real en archivo (File System Access API)
   ========================================================= */

const DB_NAME = 'cherry-storage';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'layout-file-handle';

function isSupported() {
    return 'showSaveFilePicker' in window;
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function idbGet(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
    });
}

async function idbSet(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
    });
}

let cachedHandle = null;

async function getStoredHandle() {
    if (cachedHandle) return cachedHandle;
    try {
        cachedHandle = await idbGet(HANDLE_KEY);
        return cachedHandle;
    } catch {
        return null;
    }
}

async function verifyPermission(handle, mode = 'readwrite') {
    const options = { mode };
    if ((await handle.queryPermission(options)) === 'granted') return true;
    if ((await handle.requestPermission(options)) === 'granted') return true;
    return false;
}

/* =====================================================
   VINCULAR / CREAR ARCHIVO (requiere click del usuario)
   ===================================================== */

export async function linkLayoutFile() {

    if (!isSupported()) {
        console.warn('Cherry: File System Access API no soportada en este navegador.');
        return false;
    }

    try {
        const handle = await window.showSaveFilePicker({
            suggestedName: 'cherry-layout.json',
            types: [{
                description: 'Cherry Layout JSON',
                accept: { 'application/json': ['.json'] }
            }]
        });

        await idbSet(HANDLE_KEY, handle);
        cachedHandle = handle;
        return true;

    } catch (error) {
        return false; // usuario canceló el picker
    }
}

/* =====================================================
   RECONECTAR SILENCIOSAMENTE AL ARCHIVO YA VINCULADO
   ===================================================== */

export async function tryReconnect() {

    if (!isSupported()) return false;

    const handle = await getStoredHandle();
    if (!handle) return false;

    return verifyPermission(handle, 'readwrite').catch(() => false);
}

/* =====================================================
   LEER LAYOUT DEL ARCHIVO
   ===================================================== */

export async function readLayoutFile() {

    const handle = await getStoredHandle();
    if (!handle) return null;

    try {
        const file = await handle.getFile();
        const text = await file.text();
        if (!text) return null;

        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : null;

    } catch (error) {
        console.warn('Cherry: no se pudo leer el archivo de layout', error);
        return null;
    }
}

/* =====================================================
   ESCRIBIR LAYOUT EN EL ARCHIVO
   ===================================================== */

export async function writeLayoutFile(layoutState) {

    const handle = await getStoredHandle();
    if (!handle) return false;

    try {
        const ok = await verifyPermission(handle, 'readwrite');
        if (!ok) return false;

        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(layoutState, null, 2));
        await writable.close();
        return true;

    } catch (error) {
        console.warn('Cherry: no se pudo escribir el archivo de layout', error);
        return false;
    }
}

export function isFileStorageSupported() {
    return isSupported();
}

export async function hasLinkedFile() {
    return !!(await getStoredHandle());
}