/* =========================================================
   CHERRY — GRID SYSTEM
   ========================================================= */

export class Grid {

    constructor(config = {}) {

        this.columns =
            config.columns ?? 4;

        this.rows =
            config.rows ?? 16;

        this.width =
            config.width ?? 480;

        this.height =
            config.height ?? 1920;

        this.gap =
            config.gap ?? 12;
        
        this.padding =
            config.padding ?? 16;
    }


    /* =====================================================
       ANCHO DE COLUMNA
       ===================================================== */

    getColumnWidth() {

        const totalGap =
            this.gap *
            (this.columns - 1);

        const availableWidth =
            this.width -
            (this.padding * 2);
         
        return (
            availableWidth - totalGap
        ) / this.columns;
    }


    /* =====================================================
       ALTO DE FILA
       ===================================================== */

    getRowHeight() {

        const totalGap =
            this.gap *
            (this.rows - 1);
        
        const availableHeight =
            this.height -
            (this.padding * 2);
        return (
            availableHeight - totalGap
        ) / this.rows;
    }


    /* =====================================================
       X
       ===================================================== */

    getX(column) {

        return (
            this.padding +
            column *
            (
                this.getColumnWidth() +
                this.gap
            )
        );
    }


    /* =====================================================
       Y
       ===================================================== */

    getY(row) {

        return (
            this.padding +
            row *
            (
                this.getRowHeight() +
                this.gap
            )
        );
    }


    /* =====================================================
       WIDTH
       ===================================================== */

    getWidth(columns) {

        return (
            columns *
            this.getColumnWidth()
        ) +
        (
            (columns - 1) *
            this.gap
        );
    }


    /* =====================================================
       HEIGHT
       ===================================================== */

    getHeight(rows) {

        return (
            rows *
            this.getRowHeight()
        ) +
        (
            (rows - 1) *
            this.gap
        );
    }


    /* =====================================================
       GEOMETRÍA COMPLETA
       ===================================================== */

    getGeometry(config = {}) {

        const column =
            config.column ?? 0;

        const row =
            config.row ?? 0;

        const columns =
            config.columns ?? 1;

        const rows =
            config.rows ?? 1;


        return {

            x: this.getX(column),

            y: this.getY(row),

            width:
                this.getWidth(columns),

            height:
                this.getHeight(rows)
        };
    }

    constrainGeometry(rect) {
        const width = Math.min(this.width, Math.max(1, rect.width));
        const height = Math.min(this.height, Math.max(1, rect.height));
        return { width, height, x: Math.min(this.width - width, Math.max(0, rect.x)),
            y: Math.min(this.height - height, Math.max(0, rect.y)) };
    }

    getLayoutFromGeometry(rect) {
        const columns = Math.min(this.columns, Math.max(1, Math.round((rect.width + this.gap) / (this.getColumnWidth() + this.gap))));
        const rows = Math.min(this.rows, Math.max(1, Math.round((rect.height + this.gap) / (this.getRowHeight() + this.gap))));
        return { columns, rows,
            column: Math.max(0, Math.min(this.columns - columns, Math.round((rect.x - this.padding) / (this.getColumnWidth() + this.gap)))),
            row: Math.max(0, Math.min(this.rows - rows, Math.round((rect.y - this.padding) / (this.getRowHeight() + this.gap)))) };
    }
}
