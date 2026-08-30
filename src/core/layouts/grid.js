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
}