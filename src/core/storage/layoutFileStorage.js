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
    if (cachedHandle) {
        console.log('[Cherry Storage] usando handle en caché');
        return cachedHandle;
    }
    try {
        cachedHandle = await idbGet(HANDLE_KEY);
        console.log('[Cherry Storage] handle recuperado de IndexedDB:', cachedHandle);
        return cachedHandle;
    } catch (error) {
        console.error('[Cherry Storage] error leyendo IndexedDB:', error);
        return null;
    }
}

/* =====================================================
   VERIFICAR PERMISO SIN PEDIRLO (no requiere click)
   ===================================================== */

async function checkPermissionSilently(handle, mode = 'readwrite') {
    try {
        const status = await handle.queryPermission({ mode });
        return status === 'granted';
    } catch {
        return false;
    }
}

/* =====================================================
   PEDIR PERMISO (requiere click del usuario)
   ===================================================== */

async function requestPermission(handle, mode = 'readwrite') {
    try {
        const status = await handle.requestPermission({ mode });
        return status === 'granted';
    } catch {
        return false;
    }
}

/* =====================================================
   VINCULAR / CREAR ARCHIVO NUEVO (requiere click)
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

            console.log('[Cherry Storage] archivo elegido:', handle);

            await idbSet(HANDLE_KEY, handle);
            cachedHandle = handle;

            console.log('[Cherry Storage] ✅ handle guardado en IndexedDB');
            return true;

        } catch (error) {
            console.error('[Cherry Storage] picker cancelado o falló:', error);
            return false;
        }
    }

/* =====================================================
   RECONEXIÓN SILENCIOSA (al cargar la página, sin click)
   Solo funciona si Chrome todavía recuerda el permiso.
   ===================================================== */

export async function tryReconnect() {

    console.log('[Cherry Storage] tryReconnect() iniciando...');

    if (!isSupported()) {
        console.log('[Cherry Storage] ❌ API no soportada');
        return false;
    }

    const handle = await getStoredHandle();

    if (!handle) {
        console.log('[Cherry Storage] ❌ no hay handle guardado en IndexedDB');
        return false;
    }

    const result = await checkPermissionSilently(handle, 'readwrite');
    console.log('[Cherry Storage] tryReconnect() → permiso silencioso:', result);

    return result;
}

/* =====================================================
   RECONEXIÓN MANUAL (desde un click) — pide permiso
   y devuelve el layout leído si tiene éxito
   ===================================================== */

export async function reconnectWithPermission() {

    const handle = await getStoredHandle();
    if (!handle) return { ok: false, layout: null };

    const granted = await requestPermission(handle, 'readwrite');
    if (!granted) return { ok: false, layout: null };

    const layout = await readLayoutFile();
    return { ok: true, layout };
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

        return JSON.parse(text);

    } catch (error) {
        console.warn('Cherry: no se pudo leer el archivo de layout', error);
        return null;
    }
}

/* =====================================================
   ESCRIBIR LAYOUT EN EL ARCHIVO
   ===================================================== */

export async function writeLayoutFile(layoutState) {

    console.log('[Cherry Storage] writeLayoutFile → iniciando...');

    const handle = await getStoredHandle();
    console.log('[Cherry Storage] handle obtenido:', handle);

    if (!handle) {
        console.log('[Cherry Storage] ❌ No hay handle guardado. ¿Vinculaste el archivo?');
        return false;
    }

    try {
        const alreadyGranted = await checkPermissionSilently(handle, 'readwrite');
        console.log('[Cherry Storage] permiso ya concedido (silencioso):', alreadyGranted);

        const ok = alreadyGranted || await requestPermission(handle, 'readwrite');
        console.log('[Cherry Storage] permiso final:', ok);

        if (!ok) {
            console.log('[Cherry Storage] ❌ Permiso denegado, no se puede escribir.');
            return false;
        }

        const writable = await handle.createWritable();
        console.log('[Cherry Storage] writable creado, escribiendo', layoutState.length, 'widgets...');

        await writable.write(JSON.stringify(layoutState, null, 2));
        await writable.close();

        console.log('[Cherry Storage] ✅ Escritura completada con éxito.');
        return true;

    } catch (error) {
        console.error('[Cherry Storage] ❌ Error al escribir:', error);
        return false;
    }
}

export function isFileStorageSupported() {
    return isSupported();
}

export async function hasLinkedFile() {
    return !!(await getStoredHandle());
}