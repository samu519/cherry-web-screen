import { OverlayManager } from './OverlayManager.js';

export class ContextPopover {
    constructor({ root = document.body, overlayManager = null, preferredSide = 'bottom-left' } = {}) {
        this.root = root || document.body;
        this.overlayManager = overlayManager || new OverlayManager(this.root);
        this.preferredSide = preferredSide;
        this.menuElement = null;
        this.isOpen = false;
        this.onAction = null;
    }

    open({ target, title = null, actions = [], position = null, onAction = null, preferredSide = this.preferredSide } = {}) {
        this.close();

        const createNode = (tag, className, text) => {
            if (typeof document === 'undefined' || !document.createElement) {
                return {
                    tagName: tag,
                    className: className || '',
                    textContent: text || '',
                    style: {},
                    children: [],
                    appendChild(child) { this.children.push(child); },
                    addEventListener() {},
                    setAttribute() {},
                    remove() {}
                };
            }

            const node = document.createElement(tag);
            if (className) {
                node.className = className;
            }
            if (text) {
                node.textContent = text;
            }
            return node;
        };

        const menu = createNode('div', 'cherry-context-popover');
        if (typeof menu.setAttribute === 'function') {
            menu.setAttribute('role', 'menu');
        }

        if (title) {
            const header = createNode('div', 'cherry-context-popover__header', title);
            menu.appendChild(header);
        }

        const list = createNode('div', 'cherry-context-popover__list');

        actions.forEach((action) => {
            if (action && action.divider) {
                const divider = createNode('div', 'cherry-context-popover__divider');
                list.appendChild(divider);
                return;
            }

            const item = createNode('button', 'cherry-context-popover__item', action.label || 'Action');
            if (typeof item.setAttribute === 'function') {
                item.setAttribute('role', 'menuitem');
            }

            item.addEventListener = item.addEventListener || (() => {});
            item.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();

                if (typeof action.callback === 'function') {
                    action.callback(event, action);
                }

                if (typeof onAction === 'function') {
                    onAction(action, event);
                }

                this.close();
            });

            list.appendChild(item);
        });

        menu.appendChild(list);
        this.menuElement = menu;
        this.onAction = onAction;

        const overlayElement = this.overlayManager.open({
            id: 'context-popover',
            content: menu,
            className: 'cherry-overlay--context',
            allowOutsideDismiss: true,
            onClose: () => {
                this.isOpen = false;
                this.menuElement = null;
            }
        });

        this.isOpen = true;

        if (target && overlayElement) {
            const menuSize = {
                width: menu.offsetWidth || 220,
                height: menu.offsetHeight || 180
            };

            const anchorRect = target.getBoundingClientRect();
            const containerRect = this.root && typeof this.root.getBoundingClientRect === 'function'
                ? this.root.getBoundingClientRect()
                : { left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800 };

            const nextPosition = this.calculateMenuPosition({
                anchorRect,
                menuSize,
                containerRect,
                preferredSide
            });

            menu.style = menu.style || {};
            menu.style.position = 'absolute';
            menu.style.left = `${nextPosition.x}px`;
            menu.style.top = `${nextPosition.y}px`;
            menu.style.transformOrigin = 'top left';
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(8px) scale(0.97)';

            if (typeof requestAnimationFrame === 'function') {
                requestAnimationFrame(() => {
                    menu.style.transition = 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease';
                    menu.style.opacity = '1';
                    menu.style.transform = 'translateY(0) scale(1)';
                });
            }
        }

        return menu;
    }

    calculateMenuPosition({ anchorRect, menuSize, containerRect, preferredSide = this.preferredSide }) {
        const gap = 10;
        const menuWidth = menuSize.width || 220;
        const menuHeight = menuSize.height || 180;
        const margin = 12;
        const containerLeft = containerRect.left || 0;
        const containerTop = containerRect.top || 0;
        const containerRight = (containerRect.right ?? containerRect.left + containerRect.width) || menuWidth + margin;
        const containerBottom = (containerRect.bottom ?? containerRect.top + containerRect.height) || menuHeight + margin;

        const candidates = [];
        const preferred = [preferredSide, 'bottom-left', 'top-left', 'bottom-right', 'top-right', 'right-center', 'left-center', 'bottom-center', 'top-center'];

        preferred.forEach((side) => {
            let x = anchorRect.left - containerLeft;
            let y = anchorRect.top - containerTop;

            if (side === 'bottom-left') {
                x = anchorRect.left - containerLeft;
                y = anchorRect.bottom - containerTop + gap;
            } else if (side === 'bottom-center') {
                x = anchorRect.left - containerLeft + (anchorRect.width / 2) - (menuWidth / 2);
                y = anchorRect.bottom - containerTop + gap;
            } else if (side === 'bottom-right') {
                x = anchorRect.right - containerLeft - menuWidth;
                y = anchorRect.bottom - containerTop + gap;
            } else if (side === 'top-left') {
                x = anchorRect.left - containerLeft;
                y = anchorRect.top - containerTop - menuHeight - gap;
            } else if (side === 'top-center') {
                x = anchorRect.left - containerLeft + (anchorRect.width / 2) - (menuWidth / 2);
                y = anchorRect.top - containerTop - menuHeight - gap;
            } else if (side === 'top-right') {
                x = anchorRect.right - containerLeft - menuWidth;
                y = anchorRect.top - containerTop - menuHeight - gap;
            } else if (side === 'right-center') {
                x = anchorRect.right - containerLeft + gap;
                y = anchorRect.top - containerTop + (anchorRect.height / 2) - (menuHeight / 2);
            } else if (side === 'left-center') {
                x = anchorRect.left - containerLeft - menuWidth - gap;
                y = anchorRect.top - containerTop + (anchorRect.height / 2) - (menuHeight / 2);
            }

            candidates.push({ x, y, side });
        });

        const fits = (candidate) => {
            const right = candidate.x + menuWidth;
            const bottom = candidate.y + menuHeight;
            return candidate.x >= margin && candidate.y >= margin && right <= containerRight - margin && bottom <= containerBottom - margin;
        };

        const validCandidate = candidates.find(fits) || candidates[0];
        const clampedX = Math.min(Math.max(validCandidate.x, margin), Math.max(margin, (containerRight - menuWidth) - margin));
        const clampedY = Math.min(Math.max(validCandidate.y, margin), Math.max(margin, (containerBottom - menuHeight) - margin));

        return {
            x: clampedX,
            y: clampedY,
            side: validCandidate.side
        };
    }

    close() {
        if (this.overlayManager && this.overlayManager.isOpen('context-popover')) {
            this.overlayManager.close('context-popover');
        }

        if (this.menuElement) {
            this.menuElement.remove();
            this.menuElement = null;
        }

        this.isOpen = false;
    }
}
