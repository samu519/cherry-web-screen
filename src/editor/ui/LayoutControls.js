import { ExpandablePanel } from '../../core/interaction/ExpandablePanel.js';
import { DISPLAY_PROFILES } from '../../core/layouts/displayProfiles.js';
import { MAX_LAYOUT_BYTES } from '../../core/storage/layoutDocument.js';

export class LayoutControls {
    constructor(app) {
        this.app = app;
        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.className = 'cherry-editor-entry-button cherry-layout-entry';
        this.button.style.top = '64px';
        this.button.textContent = 'Diseño y pantalla';
        this.button.setAttribute('aria-haspopup', 'dialog');
        this.button.addEventListener('click', () => this.open(this.button));
        document.body.appendChild(this.button);
        this.panel = new ExpandablePanel({ root: document.body });
    }

    open(anchor = this.button) {
        const current = this.app.getDocument();
        const content = document.createElement('div');
        content.className = 'cherry-layout-controls';
        const heading = text => {
            const title = document.createElement('h3'); title.textContent = text; content.appendChild(title);
        };
        const action = (label, handler, { close = true, disabled = false } = {}) => {
            const button = document.createElement('button');
            button.type = 'button'; button.textContent = label; button.disabled = disabled;
            button.addEventListener('click', async () => {
                if (close) this.panel.close();
                try { await handler(); } catch (error) { this.app.notify(error.message, true); }
            });
            content.appendChild(button); return button;
        };
        heading('Pantalla');
        const label = document.createElement('label'); label.textContent = 'Perfil de pantalla';
        const select = document.createElement('select'); select.setAttribute('aria-label', 'Perfil de pantalla');
        const profiles = DISPLAY_PROFILES.some(p => p.id === current.profile.id) ? DISPLAY_PROFILES : [...DISPLAY_PROFILES, current.profile];
        profiles.forEach(profile => {
            const option = document.createElement('option'); option.value = profile.id; option.textContent = profile.name;
            select.appendChild(option);
        });
        select.value = current.profile.id;
        select.addEventListener('change', async () => {
            this.panel.close();
            try { await this.app.setProfile(profiles.find(profile => profile.id === select.value)); }
            catch (error) { this.app.notify(error.message, true); }
        });
        label.appendChild(select); content.appendChild(label);
        heading('Distribución');
        for (const [mode, title] of [['freeform', 'Libre · posición en píxeles'], ['grid', 'Grid · ajustar a celdas']]) {
            const button = action(title, () => this.app.setLayoutMode(mode));
            button.setAttribute('aria-pressed', String(current.layoutMode === mode));
        }
        heading('Presets');
        const note = document.createElement('p'); note.textContent = 'Aplicar un preset reemplaza los widgets actuales. Puedes recuperar el diseño anterior desde Copia anterior.';
        content.appendChild(note);
        action('Cherry original · 480 × 1920', () => this.app.applyPreset('cherry'));
        action('Minimal · reloj, sistema y media', () => this.app.applyPreset('minimal'));
        action('Lienzo vacío', () => this.app.applyPreset('blank'));
        heading('Archivos y recuperación');
        action('Exportar layout (.json)', () => this.app.exportLayout(), { close: false });
        const file = document.createElement('input'); file.type = 'file'; file.accept = '.json,application/json'; file.hidden = true;
        file.setAttribute('aria-label', 'Importar layout');
        file.addEventListener('change', async () => {
            const selected = file.files?.[0]; if (!selected) return;
            this.panel.close();
            try {
                if (selected.size > MAX_LAYOUT_BYTES) throw new Error('El layout supera 2 MB.');
                await this.app.importLayout(await selected.text());
            } catch (error) { this.app.notify(error.message, true); }
        });
        content.appendChild(file);
        action('Importar layout (.json)', () => file.click(), { close: false });
        action('Recuperar copia anterior', () => this.app.recoverLayout(), { disabled: !this.app.hasBackup() });
        if (this.app.hasRejected()) action('Descargar documento rechazado', () => this.app.exportRejected(), { close: false });
        if (this.app.supportsLinkedFile()) {
            action('Vincular archivo y guardar', () => this.app.linkFile());
            action('Reconectar y cargar archivo vinculado', () => this.app.reconnectFile());
        }
        const hiddenWidgets = current.widgets.filter(widget => widget.flags.hidden);
        if (hiddenWidgets.length) {
            heading('Widgets ocultos');
            hiddenWidgets.forEach(widget => action(`Mostrar ${widget.type} · ${widget.id}`, () => this.app.showWidget(widget.id)));
        }
        heading('Modo pantalla');
        action('Mostrar dashboard limpio', () => this.app.setDisplayMode(true));
        const hint = document.createElement('p'); hint.textContent = 'Sin herramientas de edición. Escape o la esquina superior derecha muestra los controles otra vez.'; content.appendChild(hint);
        this.panel.open({ id: 'layout-settings', label: 'Diseño y pantalla', element: anchor, content: { element: content } });
    }
}
