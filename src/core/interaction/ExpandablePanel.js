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

export class ExpandablePanel {
    constructor({
        root = document.body,
        overlayManager = null,
        animationDuration = 250
    } = {}) {
        this.root = root || document.body;
        this.overlayManager = overlayManager;
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

        const containerEl = container || this.root;

        // Create panel structure
        this.panelElement = this._createPanelElement({
            id,
            label,
            content,
            onAction,
            onClose
        });

        this.isOpen = true;
        this.currentControlId = id;

        // Create overlay with blur
        if (this.overlayManager) {
            this.overlayElement = this.overlayManager.open({
                id: `expansion-${id}`,
                content: this.panelElement,
                className: 'cherry-overlay--expansion',
                allowOutsideDismiss: false,
                onClose: () => {
                    this.isOpen = false;
                    this.currentControlId = null;
                    this.panelElement = null;
                    if (typeof onClose === 'function') {
                        onClose();
                    }
                }
            });
        } else {
            // Fallback: append directly
            containerEl.appendChild(this.panelElement);
        }

        // Position the panel
        if (element && this.panelElement) {
            this._positionPanel(element, this.panelElement, containerEl);
        }

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

        this._animateOut(this.panelElement, () => {
            if (this.overlayManager) {
                this.overlayManager.close(`expansion-${this.currentControlId}`);
            } else if (this.panelElement && this.panelElement.parentNode) {
                this.panelElement.parentNode.removeChild(this.panelElement);
            }
        });

        this.isOpen = false;
    }

    /**
     * Create panel element structure
     */
    _createPanelElement({ id, label, content, onAction, onClose }) {
        const panel = document.createElement('div');
        panel.className = 'cherry-expansion-panel';
        panel.dataset.controlId = id;

        // Header
        const header = document.createElement('div');
        header.className = 'cherry-expansion-panel__header';

        const title = document.createElement('div');
        title.className = 'cherry-expansion-panel__title';
        title.textContent = label;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'cherry-expansion-panel__close';
        closeBtn.setAttribute('aria-label', 'Close');
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
        const itemEl = document.createElement('div');
        itemEl.className = 'cherry-expansion-panel__item';

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

        return itemEl;
    }

    /**
     * Position panel to stay within bounds
     */
    _positionPanel(anchorElement, panelElement, containerElement) {
        // Use requestAnimationFrame to ensure elements are rendered
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
                this._calculateAndSetPosition(anchorElement, panelElement, containerElement);
            });
        }
    }

    /**
     * Calculate optimal panel position
     */
    _calculateAndSetPosition(anchorElement, panelElement, containerElement) {
        const anchorRect = anchorElement.getBoundingClientRect();
        const containerRect = containerElement.getBoundingClientRect();
        const panelRect = panelElement.getBoundingClientRect();

        const GAP = 12;
        const MARGIN = 12;

        // Panel dimensions
        const panelWidth = panelRect.width || 280;
        const panelHeight = panelRect.height || 300;

        // Available space
        const spaceAbove = anchorRect.top - containerRect.top;
        const spaceBelow = containerRect.bottom - anchorRect.bottom;
        const spaceLeft = anchorRect.left - containerRect.left;
        const spaceRight = containerRect.right - anchorRect.right;

        let x, y;
        let position = 'bottom'; // default

        // Decide vertical position
        if (spaceBelow >= panelHeight + GAP) {
            // Below
            y = anchorRect.bottom - containerRect.top + GAP;
            position = 'bottom';
        } else if (spaceAbove >= panelHeight + GAP) {
            // Above
            y = anchorRect.top - containerRect.top - panelHeight - GAP;
            position = 'top';
        } else {
            // Center vertically
            y = Math.max(
                MARGIN,
                Math.min(
                    containerRect.height - panelHeight - MARGIN,
                    (containerRect.height - panelHeight) / 2
                )
            );
        }

        // Decide horizontal position (prefer right of anchor)
        const anchorCenterX = anchorRect.left - containerRect.left + anchorRect.width / 2;

        if (spaceRight >= panelWidth + GAP) {
            // Right side
            x = anchorRect.right - containerRect.left + GAP;
        } else if (spaceLeft >= panelWidth + GAP) {
            // Left side
            x = anchorRect.left - containerRect.left - panelWidth - GAP;
        } else {
            // Center horizontally
            x = Math.max(
                MARGIN,
                Math.min(
                    containerRect.width - panelWidth - MARGIN,
                    anchorCenterX - panelWidth / 2
                )
            );
        }

        // Ensure within bounds
        x = Math.max(MARGIN, Math.min(x, containerRect.width - panelWidth - MARGIN));
        y = Math.max(MARGIN, Math.min(y, containerRect.height - panelHeight - MARGIN));

        // Apply position
        panelElement.style.position = 'absolute';
        panelElement.style.left = `${x}px`;
        panelElement.style.top = `${y}px`;
        panelElement.style.transformOrigin = 'center';
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
     * Animate panel out
     */
    _animateOut(panelElement, callback) {
        if (!panelElement) {
            if (typeof callback === 'function') callback();
            return;
        }

        panelElement.style.transition = `all ${this.animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        panelElement.style.opacity = '0';
        panelElement.style.transform = 'scale(0.92)';

        setTimeout(() => {
            if (typeof callback === 'function') {
                callback();
            }
        }, this.animationDuration);
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
