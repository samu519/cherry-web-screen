import { Canvas } from "../core/canvas/Canvas.js";
import { ClockWidget } from "../widgets/clock/ClockWidget.js";
import { MediaWidget } from "../widgets/media/mediawidget.js";
import { SystemWidget } from "../widgets/system/systemwidget.js";
import { ControlsWidget } from "../widgets/controls/controlswidget.js";

const canvas = new Canvas({
    width: 480,
    height: 1920,
    columns: 4,
    rows: 16,
    gap: 12
});

const clock = new ClockWidget({
    layout: {
        column: 0,
        row: 0,
        columns: 4,
        rows: 2
    }
});

    
const media = new MediaWidget({
    layout: {
        column: 0,
        row: 2,
        columns: 4,
        rows: 5
    }
});
   
const system = new SystemWidget({
    layout: {
        x: 40,
        y: 750,
        width: 400,
        height: 400
    }
});
const controls = new ControlsWidget({
    layout: {
        column: 0,
        row: 10,
        columns: 4,
        rows: 6
    }
});

canvas.addWidget(controls);
canvas.addWidget(system);
canvas.addWidget(media);
canvas.addWidget(clock);