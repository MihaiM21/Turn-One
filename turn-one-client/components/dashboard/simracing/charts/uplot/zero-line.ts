import type uPlot from "uplot";
import { CHART } from "../chart-theme";

/**
 * Dashed horizontal reference at y = 0 whenever the pane's range spans it (steering, lateral /
 * longitudinal g, delta). Drawn after the axes so it sits above the grid but under the series.
 */
export function zeroLinePlugin(scaleKey = "y"): uPlot.Plugin {
    return {
        hooks: {
            drawAxes: [
                (u: uPlot) => {
                    const sc = u.scales[scaleKey];
                    if (sc?.min == null || sc.max == null || sc.min >= 0 || sc.max <= 0) return;
                    const y0 = u.valToPos(0, scaleKey, true);
                    const ctx = u.ctx;
                    ctx.save();
                    ctx.strokeStyle = CHART.axis;
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(u.bbox.left, y0);
                    ctx.lineTo(u.bbox.left + u.bbox.width, y0);
                    ctx.stroke();
                    ctx.restore();
                },
            ],
        },
    };
}
