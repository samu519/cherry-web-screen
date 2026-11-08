export const NATIVE_CONTROL_IDS = ['volume', 'microphone', 'wifi', 'bluetooth', 'brightness', 'doNotDisturb'];
const numeric = id => ['volume', 'microphone', 'brightness'].includes(id);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const check = (condition, message = 'Respuesta nativa no válida.') => { if (!condition) throw new Error(message); };
const finiteOrNull = value => value === null || (typeof value === 'number' && Number.isFinite(value));
const reason = value => value === null || typeof value === 'string';

function version(value) {
    check(object(value) && value.protocolVersion === 1, 'Versión del puente nativo incompatible.');
}
function controls(values) {
    check(object(values));
    for (const id of NATIVE_CONTROL_IDS) {
        const value = values[id];
        check(object(value) && typeof value.available === 'boolean' && typeof value.writable === 'boolean' && reason(value.reason));
        check(value.value === null || (numeric(id) ? typeof value.value === 'number' && value.value >= 0 && value.value <= 100 : typeof value.value === 'boolean'));
        check(!value.available || value.value !== null);
    }
}
export function validateMedia(value) {
    check(object(value) && typeof value.available === 'boolean' && typeof value.playing === 'boolean');
    check(typeof value.title === 'string' && typeof value.artist === 'string' && reason(value.reason));
    check(value.artwork === null || typeof value.artwork === 'string' && /^data:image\/(png|jpeg|webp);base64,[a-z\d+/=]+$/i.test(value.artwork) && value.artwork.length < 1_500_000);
    check(finiteOrNull(value.positionSeconds) && finiteOrNull(value.durationSeconds));
    check(object(value.controls) && ['playPause', 'previous', 'next'].every(id => typeof value.controls[id] === 'boolean'));
    return value;
}
export function validateSnapshot(value) {
    version(value);
    check(Number.isFinite(value.sampledAt) && typeof value.provider === 'string' && object(value.telemetry));
    for (const key of ['cpu', 'ram', 'gpu', 'temperature']) {
        const reading = value.telemetry[key];
        check(object(reading) && finiteOrNull(reading.value) && typeof reading.unit === 'string' && reason(reading.reason));
        if (key !== 'temperature' && reading.value !== null) check(reading.value >= 0 && reading.value <= 100);
    }
    check(finiteOrNull(value.telemetry.memoryUsedBytes) && finiteOrNull(value.telemetry.memoryTotalBytes));
    check(Array.isArray(value.telemetry.sensors) && value.telemetry.sensors.every(sensor => object(sensor) &&
        ['id', 'name', 'kind', 'unit'].every(key => typeof sensor[key] === 'string') && Number.isFinite(sensor.value)));
    controls(value.controls); validateMedia(value.media);
    return value;
}

/** Runtime-validated IPC adapter. See nativeBridge.d.ts for the shared frontend contract. */
export class NativeBridge {
    constructor(invoke = globalThis.window?.__TAURI__?.core?.invoke ?? null, timeout = 15000) {
        this.invoke = invoke;
        this.available = typeof invoke === 'function';
        this.timeout = timeout;
        this.inflight = new Set();
    }
    async call(command, args) {
        if (!this.available) throw new Error('Cherry Core no está conectado.');
        const reading = command === 'native_snapshot' || command === 'native_capabilities';
        const key = command === 'native_set_control' ? `${command}:${args?.request?.id}` : command;
        if (this.inflight.has(key)) throw new Error(reading ? 'Windows todavía está procesando la lectura anterior.' : 'Windows todavía está procesando esta operación.');
        this.inflight.add(key);
        let timer;
        const operation = Promise.resolve().then(() => this.invoke(command, args));
        operation.then(() => this.inflight.delete(key), () => this.inflight.delete(key));
        try { return await Promise.race([operation, new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error('Windows no respondió a tiempo. Se volverá a consultar el estado.')), this.timeout);
        })]); }
        catch (error) { throw new Error(typeof error === 'string' ? error : error?.message || 'La operación nativa falló.'); }
        finally { clearTimeout(timer); }
    }
    async discover() {
        const result = await this.call('native_capabilities'); version(result); controls(result.controls);
        check(typeof result.platform === 'string' && typeof result.provider === 'string' && typeof result.media === 'boolean' && reason(result.sensorProvider));
        return result;
    }
    async snapshot() { return validateSnapshot(await this.call('native_snapshot')); }
    /** @param {import('./nativeBridge').ControlId} id @param {boolean|number} value */
    async setControl(id, value) {
        check(NATIVE_CONTROL_IDS.includes(id), 'Control del sistema no compatible.');
        check(numeric(id) ? typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100 : typeof value === 'boolean', 'Valor de control no válido.');
        const result = await this.call('native_set_control', { request: { id, value } }); version(result);
        check(result.id === id && (numeric(id) ? typeof result.value === 'number' && Number.isFinite(result.value) && result.value >= 0 && result.value <= 100 : typeof result.value === 'boolean'));
        return result;
    }
    /** @param {import('./nativeBridge').MediaAction} action */
    async mediaAction(action) {
        check(['playPause', 'previous', 'next'].includes(action), 'Acción multimedia no compatible.');
        return validateMedia(await this.call('native_media_action', { action }));
    }
}
