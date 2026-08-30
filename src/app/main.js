import { Canvas } from "../core/canvas/Canvas.js";
import { ClockWidget } from "../widgets/clock/ClockWidget.js";

const container = document.getElementById("cherry-canvas");

const canvas = new Canvas(container);

const clock = new ClockWidget({
    geometry: {
        x: 40,
        y: 40,
        width: 400,
        height: 120
    }
});

canvas.addWidget(clock);