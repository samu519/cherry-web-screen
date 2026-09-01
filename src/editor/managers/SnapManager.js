/* =========================================================
   CHERRY EDITOR — SNAP MANAGER
   Snap a grid, snap a widgets, guías
   ========================================================= */

export class SnapManager {

    constructor(editorState, gridSize = 12) {

        this.state = editorState;
        this.gridSize = gridSize;
        this.snapDistance = 8; // píxeles
    }


    /* =====================================================
       SNAP A GRID
       ===================================================== */

    snapToGrid(value) {

        if (!this.state.snapEnabled) return value;

        return Math.round(value / this.gridSize) * this.gridSize;
    }


    /* =====================================================
       SNAP A POSICIÓN (grid + widgets + guías)
       ===================================================== */

    snapPosition(x, y, elementRect, allWidgets = []) {

        let snappedX = x;
        let snappedY = y;
        let snaps = [];

        // Snap a grid
        if (this.state.snapEnabled) {

            snappedX = this.snapToGrid(x);
            snappedY = this.snapToGrid(y);

            snaps.push({
                type: 'grid',
                x: snappedX,
                y: snappedY,
                guides: [
                    { axis: 'horizontal', pos: snappedY },
                    { axis: 'vertical', pos: snappedX }
                ]
            });
        }

        // Snap a otros widgets (si no hay snap a grid, intentar con widgets)
        if (allWidgets.length > 0) {

            const widgetSnaps = this.snapToWidgets(x, y, elementRect, allWidgets);

            if (widgetSnaps.length > 0) {
                snaps.push(...widgetSnaps);
            }
        }

        // Elegir el snap más cercano
        if (snaps.length > 0) {

            const closestSnap = snaps.reduce((best, snap) => {

                const distX = Math.abs(snap.x - x);
                const distY = Math.abs(snap.y - y);
                const dist = Math.sqrt(distX * distX + distY * distY);

                if (!best || dist < best.distance) {
                    return { ...snap, distance: dist };
                }

                return best;
            });

            if (closestSnap.distance <= this.snapDistance) {
                return {
                    x: closestSnap.x,
                    y: closestSnap.y,
                    snapped: true,
                    guides: closestSnap.guides || []
                };
            }
        }

        return {
            x,
            y,
            snapped: false,
            guides: []
        };
    }


    /* =====================================================
       SNAP A WIDGETS
       ===================================================== */

    snapToWidgets(x, y, elementRect, widgets) {

        const snaps = [];

        widgets.forEach(widget => {

            const wRect = widget.getBoundingClientRect();

            // Edges
            const edges = [
                { type: 'left', pos: wRect.left, axis: 'vertical' },
                { type: 'right', pos: wRect.right, axis: 'vertical' },
                { type: 'top', pos: wRect.top, axis: 'horizontal' },
                { type: 'bottom', pos: wRect.bottom, axis: 'horizontal' },
                { type: 'center-x', pos: wRect.left + wRect.width / 2, axis: 'vertical' },
                { type: 'center-y', pos: wRect.top + wRect.height / 2, axis: 'horizontal' }
            ];

            edges.forEach(edge => {

                if (edge.axis === 'vertical') {

                    const distX = Math.abs(x - edge.pos);

                    if (distX <= this.snapDistance) {
                        snaps.push({
                            type: 'widget',
                            x: edge.pos,
                            y: y,
                            guides: [{ axis: 'vertical', pos: edge.pos }],
                            distance: distX
                        });
                    }

                } else {

                    const distY = Math.abs(y - edge.pos);

                    if (distY <= this.snapDistance) {
                        snaps.push({
                            type: 'widget',
                            x: x,
                            y: edge.pos,
                            guides: [{ axis: 'horizontal', pos: edge.pos }],
                            distance: distY
                        });
                    }
                }
            });
        });

        return snaps;
    }


    /* =====================================================
       SNAP A DIMENSIONES
       ===================================================== */

    snapSize(width, height, allWidgets = []) {

        let snappedW = width;
        let snappedH = height;

        if (this.state.snapEnabled) {

            snappedW = this.snapToGrid(width);
            snappedH = this.snapToGrid(height);
        }

        return { width: snappedW, height: snappedH };
    }


    /* =====================================================
       CALCULAR GUÍAS VISUALES
       ===================================================== */

    calculateGuides(elementRect, allWidgets = []) {

        if (!this.state.guidesVisible) return [];

        const guides = [];

        allWidgets.forEach(widget => {

            const wRect = widget.getBoundingClientRect();

            // Alineación vertical
            if (Math.abs(elementRect.left - wRect.left) < 5) {
                guides.push({
                    type: 'vertical',
                    position: wRect.left,
                    label: 'left'
                });
            }

            if (Math.abs(elementRect.right - wRect.right) < 5) {
                guides.push({
                    type: 'vertical',
                    position: wRect.right - elementRect.width,
                    label: 'right'
                });
            }

            if (Math.abs((elementRect.left + elementRect.width / 2) - (wRect.left + wRect.width / 2)) < 5) {
                guides.push({
                    type: 'vertical',
                    position: wRect.left + wRect.width / 2 - elementRect.width / 2,
                    label: 'center'
                });
            }

            // Alineación horizontal
            if (Math.abs(elementRect.top - wRect.top) < 5) {
                guides.push({
                    type: 'horizontal',
                    position: wRect.top,
                    label: 'top'
                });
            }

            if (Math.abs(elementRect.bottom - wRect.bottom) < 5) {
                guides.push({
                    type: 'horizontal',
                    position: wRect.bottom - elementRect.height,
                    label: 'bottom'
                });
            }

            if (Math.abs((elementRect.top + elementRect.height / 2) - (wRect.top + wRect.height / 2)) < 5) {
                guides.push({
                    type: 'horizontal',
                    position: wRect.top + wRect.height / 2 - elementRect.height / 2,
                    label: 'center'
                });
            }
        });

        return guides;
    }


    /* =====================================================
       OBTENER DISTANCIAS ENTRE ELEMENTOS
       ===================================================== */

    getDistances(elementRect, allWidgets = []) {

        if (!this.state.distancesVisible) return [];

        const distances = [];

        allWidgets.forEach(widget => {

            const wRect = widget.getBoundingClientRect();

            const distLeft = elementRect.left - wRect.right;
            const distRight = wRect.left - elementRect.right;
            const distTop = elementRect.top - wRect.bottom;
            const distBottom = wRect.top - elementRect.bottom;

            if (Math.abs(distLeft) < 30 && distLeft > 0) {
                distances.push({ type: 'horizontal', value: distLeft, pos: 'left' });
            }

            if (Math.abs(distRight) < 30 && distRight > 0) {
                distances.push({ type: 'horizontal', value: distRight, pos: 'right' });
            }

            if (Math.abs(distTop) < 30 && distTop > 0) {
                distances.push({ type: 'vertical', value: distTop, pos: 'top' });
            }

            if (Math.abs(distBottom) < 30 && distBottom > 0) {
                distances.push({ type: 'vertical', value: distBottom, pos: 'bottom' });
            }
        });

        return distances;
    }
}
