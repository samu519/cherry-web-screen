import { NativeBridge, NATIVE_CONTROL_IDS } from './nativeBridge.js';
import { appState } from '../core/state/appState.js';

export class NativeService {
    constructor({ bridge = new NativeBridge(), state = appState, interval = 2000 } = {}) {
        this.bridge = bridge; this.state = state; this.interval = interval;
        this.mode = bridge.available ? 'connecting' : 'demo';
        this.snapshot = null; this.capabilities = null; this.error = null;
        this.pending = new Set(); this.listeners = new Set(); this.revision = 0;
        this.timer = null; this.running = false; this.mediaPending = false;
        this.mediaRevision = 0;
    }
    get isNative() { return this.bridge.available; }
    isSystemControl(id) { return this.isNative && [...NATIVE_CONTROL_IDS, 'airplane', 'batterySaver'].includes(id); }
    subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
    publish() { for (const listener of this.listeners) listener(this); }
    async start() {
        if (!this.isNative || this.running) return;
        this.running = true;
        for (const id of NATIVE_CONTROL_IDS) this.state.set(id, null, 'native:connecting');
        this.publish();
        await this.poll();
    }
    stop() { this.running = false; clearTimeout(this.timer); this.timer = null; }
    async poll() {
        const revision = this.revision;
        const mediaRevision = this.mediaRevision;
        try {
            if (!this.capabilities) this.capabilities = await this.bridge.discover();
            const snapshot = await this.bridge.snapshot();
            if (!this.running) return;
            if ((this.mediaPending || mediaRevision !== this.mediaRevision) && this.snapshot) snapshot.media = this.snapshot.media;
            for (const [id, control] of Object.entries(snapshot.controls)) {
                if (this.pending.has(id) || revision !== this.revision) {
                    const confirmed = this.snapshot?.controls[id];
                    if (confirmed) snapshot.controls[id] = { ...control, value: confirmed.value };
                }
            }
            this.snapshot = snapshot; this.mode = 'live'; this.error = null;
            if (this.capabilities) this.capabilities.controls = snapshot.controls;
            if (revision === this.revision) for (const [id, control] of Object.entries(snapshot.controls)) {
                if (!this.pending.has(id)) this.state.set(id, control.available ? control.value : null, 'native:sample');
            }
        } catch (error) {
            if (!this.running) return;
            this.mode = 'offline'; this.snapshot = null; this.error = error.message;
            for (const id of NATIVE_CONTROL_IDS) if (!this.pending.has(id)) this.state.set(id, null, 'native:offline');
        }
        this.publish();
        if (this.running) this.timer = setTimeout(() => this.poll(), this.interval);
    }
    control(id) {
        if (!this.isSystemControl(id)) return null;
        const control = this.mode === 'live' ? this.snapshot?.controls[id] : null;
        return control || { available: false, writable: false, value: null,
            reason: this.error || (this.mode === 'connecting' ? 'Conectando con Windows…' : 'No disponible en este proveedor.') };
    }
    async requestControl(id, value) {
        if (!this.isSystemControl(id)) { this.state.set(id, value, 'ui'); return value; }
        const control = this.control(id);
        if (!control?.available || !control.writable) throw new Error(control?.reason || 'Control no disponible.');
        if (this.pending.has(id)) return this.state.get(id);
        this.pending.add(id); this.revision++; this.publish();
        try {
            const result = await this.bridge.setControl(id, value);
            this.error = null;
            this.state.set(id, result.value, 'native:confirmed');
            if (this.snapshot?.controls[id]) this.snapshot.controls[id].value = result.value;
            return result.value;
        } finally { this.revision++; this.pending.delete(id); this.publish(); }
    }
    requestFromUI(id, value) {
        return this.requestControl(id, value).catch(error => { this.error = error.message; this.publish(); this.onError?.(error.message); });
    }
    async mediaAction(action) {
        if (!this.isNative || this.mediaPending) return;
        if (!this.snapshot?.media.available || !this.snapshot.media.controls[action]) throw new Error(this.snapshot?.media.reason || 'Acción multimedia no disponible.');
        this.mediaPending = true; this.mediaRevision++; this.publish();
        try { const media = await this.bridge.mediaAction(action); if (this.snapshot) this.snapshot.media = media; }
        finally { this.mediaRevision++; this.mediaPending = false; this.publish(); }
    }
    decorateControls(root, defaultId) {
        if (!root || !this.isNative) return;
        for (const node of [root, ...root.querySelectorAll('[data-control]')]) {
            const id = node.dataset.control || (node === root ? defaultId : null);
            if (!this.isSystemControl(id)) continue;
            const capability = this.control(id);
            const disabled = !capability.available || !capability.writable || this.pending.has(id);
            const elements = node.matches('button, input') ? [node] : node.querySelectorAll('button, input');
            for (const element of elements) {
                element.disabled = disabled;
                element.setAttribute('aria-busy', String(this.pending.has(id)));
                element.setAttribute('aria-description', capability.reason || 'Estado confirmado por Windows');
                element.title = capability.reason || 'Windows';
            }
            node.dataset.nativeStatus = capability.available ? (this.pending.has(id) ? 'pending' : 'live') : 'unavailable';
            if (node.classList.contains('cherry-expansion-panel__item') && typeof capability.value === 'boolean') {
                node.classList.toggle('selected', capability.available && capability.value);
                const secondary = node.querySelector('.cherry-expansion-panel__item-secondary');
                const text = this.pending.has(id) ? 'Esperando confirmación…' : capability.reason || (capability.available ? (capability.value ? 'Activado' : 'Desactivado') : 'No disponible');
                if (secondary && secondary.textContent !== text) secondary.textContent = text;
            }
            for (const value of node.querySelectorAll('.cherry-slider-value, .cherry-slider-bar-value, .cherry-control-value')) {
                const text = !capability.available ? '—' : String(capability.value) + (value.classList.contains('cherry-control-value') ? '%' : '');
                if (value.textContent !== text) value.textContent = text;
            }
            for (const input of node.querySelectorAll('input[type="range"]')) input.value = capability.value ?? 0;
        }
    }
}

export const nativeService = new NativeService();
