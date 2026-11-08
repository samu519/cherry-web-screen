export function snapshot() {
    const unavailable = { available: false, writable: false, value: null, reason: 'Sin proveedor' };
    const reading = value => ({ value, unit: '%', reason: value === null ? 'Sin sensor' : null });
    return { protocolVersion: 1, sampledAt: Date.now(), provider: 'windows',
        telemetry: { cpu: reading(25), ram: reading(40), gpu: reading(null), temperature: { ...reading(null), unit: '°C' },
            memoryUsedBytes: 4000, memoryTotalBytes: 10000, sensors: [] },
        controls: Object.fromEntries(['volume', 'microphone', 'wifi', 'bluetooth', 'brightness', 'doNotDisturb'].map(id => [id,
            ['volume', 'wifi'].includes(id) ? { available: true, writable: true, value: id === 'volume' ? 32 : false, reason: null } : { ...unavailable }])),
        media: { available: false, title: '', artist: '', artwork: null, playing: false, positionSeconds: null, durationSeconds: null,
            controls: { playPause: false, previous: false, next: false }, reason: 'No hay sesión activa' }
    };
}
export const capabilities = () => ({ protocolVersion: 1, platform: 'windows', provider: 'windows', controls: snapshot().controls, media: true, sensorProvider: null });
