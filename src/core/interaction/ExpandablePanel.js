/**
 * =========================================================
 * CHERRY — EXPANDABLE PANEL
 * 
 * The UI component for expanded control content.
 * 
 * - Renders expansion content
 * - Handles positioning with bounds checking
 * - Manages animations
 * - Provides blur overlay
 * ========================================================= */

import { OverlayManager } from './OverlayManager.js';
import { nativeService } from '../../services/nativeService.js';

let panelSequence = 0;

export class ExpandablePanel {
    constructor({
        root = document.body,
        overlayManager = null,
        animationDuration = 250
    } = {}) {
        this.root = root || document.body;
        this.overlayManager = overlayManager || new OverlayManager(this.root);
        this.animationDuration = animationDuration;

        // UI elements
        this.panelElement = null;
        this.contentElement = null;
        this.overlayElement = null;

        // State
        this.isOpen = false;
        this.currentControlId = null;

        // Animation frame ID
        this.animationFrameId = null;
    }

    /**
     * Open the expandable panel
     */
    open({
        id = 'panel',
        label = '',
        content = {},
        element = null,
        container = null,
        onAction = null,
        onClose = null
    } = {}) {
        // Close previous
        this.close();

        if (nativeService.isSystemControl(id)) content = this.nativeContent(id, label);

        // Create panel structure
        this.panelElement = this._createPanelElement({
            id,
            label,
            content,
            onAction,
            onClose: () => this.close()
        });

        this.isOpen = true;
        this.currentControlId = id;
        if (nativeService.isSystemControl(id)) this.unsubscribeNative = nativeService.subscribe(() => {
            this.updateContent(this.nativeContent(id, label));
        });

        // Create overlay with blur
        if (this.overlayManager) {
            this.overlayElement = this.overlayManager.open({
                id: `expansion-${id}`,
                content: this.panelElement,
                className: 'cherry-overlay--expansion',
                allowOutsideDismiss: true,
                returnFocus: element,
                onClose: () => {
                    this.unsubscribeNative?.(); this.unsubscribeNative = null;
                    this.isOpen = false;
                    this.currentControlId = null;
                    this.panelElement = null;
                    this.contentElement = null;
                    if (typeof onClose === 'function') {
                        onClose();
                    }
                }
            });
        } else {
            // Fallback: append directly
            (container || this.root).appendChild(this.panelElement);
        }

        // The overlay centers the panel in canvas coordinates, independent of the trigger.

        // Animate in
        this._animateIn(this.panelElement);
    }

    /**
     * Close the panel
     */
    close() {
        if (!this.isOpen || !this.panelElement) {
            return;
        }

        // Close synchronously so a delayed callback cannot close a newly opened panel.
        this.overlayManager.close(`expansion-${this.currentControlId}`);
    }

    nativeContent(id, label) {
        const control = nativeService.control(id);
        const value = control?.available ? (typeof control.value === 'boolean' ? (control.value ? 'Activado' : 'Desactivado') : `${control.value}%`) : 'No disponible';
        return { title: label, items: [
            { label: value, secondary: nativeService.pending.has(id) ? 'Esperando confirmación de Windows…' : (control?.reason || 'Estado confirmado por Windows') },
            ...(['wifi', 'bluetooth'].includes(id) ? [{ label: 'Dispositivos y conexiones', secondary: 'La exploración de redes y el emparejamiento aún no están implementados.' }] : [])
        ] };
    }

    /**
     * Create panel element structure
     */
    _createPanelElement({ id, label, content, onAction, onClose }) {
        const panel = document.createElement('div');
        panel.className = 'cherry-expansion-panel';
        panel.dataset.controlId = id;
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        panel.tabIndex = -1;

        // Header
        const header = document.createElement('div');
        header.className = 'cherry-expansion-panel__header';

        const title = document.createElement('div');
        title.className = 'cherry-expansion-panel__title';
        title.textContent = label;
        title.id = `cherry-panel-title-${++panelSequence}`;
        panel.setAttribute('aria-labelledby', title.id);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'cherry-expansion-panel__close';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Cerrar ajustes');
        closeBtn.innerHTML = '✕';
        closeBtn.addEventListener('click', () => {
            if (typeof onClose === 'function') {
                onClose();
            }
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'cherry-expansion-panel__content';

        // Render content based on type
        this._renderContent(contentContainer, content, onAction);

        panel.appendChild(header);
        panel.appendChild(contentContainer);

        this.contentElement = contentContainer;

        return panel;
    }

    /**
     * Render content based on control type
     */
    _renderContent(container, content, onAction) {
        container.innerHTML = '';

        if (typeof content === 'string') {
            container.innerHTML = content;
            return;
        }

        if (content && typeof content === 'object') {
            // Content is expected to be an object with specific properties
            // This will be tailored by each control type handler

            if (content.html) {
                container.innerHTML = content.html;
            } else if (content.element) {
                container.appendChild(content.element);
            } else {
                // Default: render as structured content
                this._renderStructuredContent(container, content, onAction);
            }
        }
    }

    /**
     * Render structured content (info list, controls, etc.)
     */
    _renderStructuredContent(container, content, onAction) {
        // Title
        if (content.title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'cherry-expansion-panel__section-title';
            titleEl.textContent = content.title;
            container.appendChild(titleEl);
        }

        // Items list
        if (content.items && Array.isArray(content.items)) {
            const list = document.createElement('div');
            list.className = 'cherry-expansion-panel__items';

            content.items.forEach((item) => {
                const itemEl = this._createContentItem(item, onAction);
                list.appendChild(itemEl);
            });

            container.appendChild(list);
        }

        // Actions
        if (content.actions && Array.isArray(content.actions)) {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'cherry-expansion-panel__actions';

            content.actions.forEach((action) => {
                const btn = document.createElement('button');
                btn.className = 'cherry-expansion-panel__action-btn';
                btn.textContent = action.label || 'Action';

                if (action.icon) {
                    btn.textContent = `${action.icon} ${btn.textContent}`;
                }

                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (typeof action.callback === 'function') {
                        action.callback(e, action);
                    }

                    if (typeof onAction === 'function') {
                        onAction(action, e);
                    }
                });

                actionsContainer.appendChild(btn);
            });

            container.appendChild(actionsContainer);
        }
    }

    /**
     * Create a single content item
     */
    _createContentItem(item, onAction) {
        if (item && item.element instanceof HTMLElement) {
            return item.element;
        }

        const itemEl = document.createElement(item.callback ? 'button' : 'div');
        if (item.callback) itemEl.type = 'button';
        itemEl.className = 'cherry-expansion-panel__item';
        if (item.id) itemEl.dataset.control = item.id;

        if (item.selected) {
            itemEl.classList.add('selected');
        }

        if (item.icon) {
            const iconEl = document.createElement('span');
            iconEl.className = 'cherry-expansion-panel__item-icon';
            iconEl.textContent = item.icon;
            itemEl.appendChild(iconEl);
        }

        const textEl = document.createElement('div');
        textEl.className = 'cherry-expansion-panel__item-text';

        const labelEl = document.createElement('div');
        labelEl.className = 'cherry-expansion-panel__item-label';
        labelEl.textContent = item.label;
        textEl.appendChild(labelEl);

        if (item.secondary) {
            const secondaryEl = document.createElement('div');
            secondaryEl.className = 'cherry-expansion-panel__item-secondary';
            secondaryEl.textContent = item.secondary;
            textEl.appendChild(secondaryEl);
        }

        itemEl.appendChild(textEl);

        if (item.callback) {
            itemEl.classList.add('interactive');
            itemEl.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (typeof item.callback === 'function') {
                    item.callback(e, item);
                }
            });
        }

        nativeService.decorateControls(itemEl);
        return itemEl;
    }

    /**
     * Animate panel in
     */
    _animateIn(panelElement) {
        if (!panelElement) return;

        panelElement.style.opacity = '0';
        panelElement.style.transform = 'scale(0.92)';

        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                panelElement.style.transition = `all ${this.animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
                panelElement.style.opacity = '1';
                panelElement.style.transform = 'scale(1)';
            });
        }
    }

    /**
     * Update content
     */
    updateContent(content, onAction) {
        if (this.contentElement) {
            this._renderContent(this.contentElement, content, onAction);
        }
    }
}
