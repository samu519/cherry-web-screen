/**
 * =========================================================
 * CHERRY — EXPANSION MANAGER
 * 
 * Orchestrates the expansion of interactive controls
 * (e.g., Wi-Fi, Bluetooth, Volume).
 * 
 * - Manages expansion lifecycle
 * - Coordinates overlays and animations
 * - Delegates content to expansion handlers
 * - Handles positioning and bounds checking
 * ========================================================= */

import { OverlayManager } from './OverlayManager.js';
import { ExpandablePanel } from './ExpandablePanel.js';

export class ExpansionManager {
    constructor({
        root = document.body,
        threshold = 500,
        animationDuration = 250
    } = {}) {
        this.root = root || document.body;
        this.threshold = threshold;
        this.animationDuration = animationDuration;

        // Active state
        this.isExpanded = false;
        this.expandedControlId = null;
        this.expandedElement = null;
        this.activePanel = null;
        this.activeOverlay = null;

        // Handlers registry
        this.handlers = new Map();

        // Managers
        this.overlayManager = new OverlayManager(this.root);
        this.panel = new ExpandablePanel({
            root: this.root,
            overlayManager: this.overlayManager,
            animationDuration: this.animationDuration
        });

        // Timers
        this.pressTimer = null;
        this.activePress = null;

        // Event handling
        this._handleDocumentClick = this._handleDocumentClick.bind(this);
        this._handlePointerMove = this._handlePointerMove.bind(this);
        this._handlePointerUp = this._handlePointerUp.bind(this);

        if (typeof document !== 'undefined') {
            document.addEventListener('click', this._handleDocumentClick);
        }
    }

    /**
     * Register a control that can be expanded
     * @param {HTMLElement} element - The control element
     * @param {Object} config - Configuration object
     * @param {string} config.id - Control ID (e.g., "wifi")
     * @param {string} config.label - Display label
     * @param {Function} config.getContent - Function that returns expansion content
     * @param {Function} config.onAction - Handler for expansion actions
     * @param {number} config.threshold - Optional custom threshold
     */
    register(element, config = {}) {
        if (!element || !config.id) {
            console.warn('ExpansionManager: element and config.id are required');
            return null;
        }

        const payload = {
            element,
            id: config.id,
            label: config.label || config.id,
            getContent: config.getContent || (() => ({})),
            onAction: config.onAction || null,
            threshold: config.threshold || this.threshold
        };

        this.handlers.set(element, payload);

        // Add event listeners for expansion detection
        const handlePointerDown = (event) => {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }
            this._startPress(element, payload, event);
        };

        const handlePointerMove = (event) => {
            if (!this.activePress || this.activePress.element !== element) {
                return;
            }

            const dx = Math.abs(event.clientX - this.activePress.startX);
            const dy = Math.abs(event.clientY - this.activePress.startY);

            // Cancel if moved too much
            if (dx > 12 || dy > 12) {
                this._cancelPress();
            }
        };

        const handlePointerUp = () => {
            if (this.activePress && this.activePress.element === element) {
                this._cancelPress();
            }
        };

        if (!element.__cherryExpansionHandlers) {
            element.__cherryExpansionHandlers = new Map();
        }

        element.__cherryExpansionHandlers.set('pointerdown', handlePointerDown);
        element.__cherryExpansionHandlers.set('pointermove', handlePointerMove);
        element.__cherryExpansionHandlers.set('pointerup', handlePointerUp);
        element.__cherryExpansionHandlers.set('pointercancel', handlePointerUp);

        element.addEventListener('pointerdown', handlePointerDown);
        element.addEventListener('pointermove', handlePointerMove);
        element.addEventListener('pointerup', handlePointerUp);
        element.addEventListener('pointercancel', handlePointerUp);

        return element;
    }

    /**
     * Unregister a control
     */
    unregister(element) {
        const handlers = element?.__cherryExpansionHandlers;
        if (!handlers) {
            return;
        }

        handlers.forEach((handler, type) => {
            element.removeEventListener(type, handler);
        });

        element.__cherryExpansionHandlers = null;
        this.handlers.delete(element);
    }

    /**
     * Start press detection
     */
    _startPress(element, payload, event) {
        this._cancelPress();

        this.activePress = {
            element,
            payload,
            startX: event.clientX,
            startY: event.clientY,
            startTime: Date.now()
        };

        // Set timer for expansion
        this.pressTimer = setTimeout(() => {
            this._expand(element, payload);
        }, payload.threshold);
    }

    /**
     * Cancel current press
     */
    _cancelPress() {
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
        this.activePress = null;
    }

    /**
     * Expand the control
     */
    _expand(element, payload) {
        if (this.isExpanded && this.expandedControlId === payload.id) {
            return; // Already expanded
        }

        // Close previous expansion
        if (this.isExpanded) {
            this.collapse();
        }

        this.isExpanded = true;
        this.expandedControlId = payload.id;
        this.expandedElement = element;

        // Get expansion content
        const content = payload.getContent({
            controlId: payload.id,
            controlLabel: payload.label
        });

        // Open the expandable panel
        this.panel.open({
            id: payload.id,
            label: payload.label,
            content: content,
            element: element,
            container: this.root,
            onAction: payload.onAction,
            onClose: () => {
                this.collapse();
            }
        });

        // Suppress regular click
        if (this.activePress) {
            this.activePress.suppressClick = true;
        }
    }

    /**
     * Collapse the expanded control
     */
    collapse() {
        if (!this.isExpanded) {
            return;
        }

        this.isExpanded = false;
        this.expandedControlId = null;
        this.expandedElement = null;

        this.panel.close();
    }

    /**
     * Toggle expansion
     */
    toggle(element, payload) {
        if (this.isExpanded && this.expandedControlId === payload.id) {
            this.collapse();
        } else {
            this._expand(element, payload);
        }
    }

    /**
     * Handle document click for closing
     */
    _handleDocumentClick(event) {
        if (!this.isExpanded) {
            return;
        }

        const panel = this.panel.panelElement;
        const element = this.expandedElement;

        // Check if click is on panel or expanded element
        if (panel && (panel === event.target || panel.contains(event.target))) {
            return;
        }

        if (element && (element === event.target || element.contains(event.target))) {
            return;
        }

        // Click outside, close expansion
        this.collapse();
    }

    /**
     * Check if a control is expanded
     */
    isControlExpanded(controlId) {
        return this.isExpanded && this.expandedControlId === controlId;
    }

    /**
     * Destroy manager and clean up
     */
    destroy() {
        if (typeof document !== 'undefined') {
            document.removeEventListener('click', this._handleDocumentClick);
        }

        this.handlers.forEach((_, element) => {
            this.unregister(element);
        });

        this.collapse();
        this.overlayManager = null;
        this.panel = null;
        this.handlers.clear();
    }
}
