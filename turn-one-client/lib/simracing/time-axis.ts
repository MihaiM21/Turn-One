/**
 * Time axis for the workbench charts (PBI-071). The charts stay on the lap's distance grid (one
 * point every `stepM`, both laps aligned by position, which is the fair comparison); only the x
 * value of each grid point changes, from metres to the selected lap's elapsed time there. Slow
 * corners therefore take more width, as they take more of the lap.
 */

export interface TimeAxis {
    /** Elapsed seconds at each grid point; strictly increasing. */
    x: Float32Array;
    toX: (m: number) => number;
    fromX: (x: number) => number;
}

/**
 * @param times elapsed seconds of the selected lap at grid points 0…times.length-1
 * @param stepM grid spacing in metres
 * @param length number of grid points the charts draw (may exceed `times` when the reference is longer)
 */
export function buildTimeAxis(times: ArrayLike<number>, stepM: number, length: number): TimeAxis {
    const n = Math.max(length, 1);
    const x = new Float32Array(n);
    const known = Math.min(times.length, n);
    // Mean seconds per grid step, to extend past the end of the lap if the reference is longer.
    const span = known > 1 ? (times[known - 1] - times[0]) / (known - 1) : 0.05;
    const dt = Number.isFinite(span) && span > 0 ? span : 0.05;
    for (let i = 0; i < n; i++) {
        const t = i < known && Number.isFinite(times[i]) ? times[i] : i > 0 ? x[i - 1] + dt : 0;
        // Strictly increasing, so the axis and the binary searches stay well defined.
        x[i] = i > 0 ? Math.max(t, x[i - 1] + 1e-4) : t;
    }

    const toX = (m: number) => {
        const f = Math.max(0, m / stepM);
        const i = Math.floor(f);
        if (i >= n - 1) return x[n - 1] + (f - (n - 1)) * dt;
        return x[i] + (x[i + 1] - x[i]) * (f - i);
    };

    const fromX = (v: number) => {
        if (v <= x[0]) return 0;
        if (v >= x[n - 1]) return (n - 1) * stepM;
        let lo = 0;
        let hi = n - 1;
        while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (x[mid] <= v) lo = mid;
            else hi = mid;
        }
        return (lo + (v - x[lo]) / (x[hi] - x[lo])) * stepM;
    };

    return { x, toX, fromX };
}

type CornerLike = {
    entryM: number;
    apexM: number;
    exitM: number;
    brakingPointM?: number | null;
    throttleOnM?: number | null;
};

/** A corner's landmarks moved onto the chart axis, so the corner bands line up in time mode. */
export function cornerOnAxis<C extends CornerLike>(c: C, toX: (m: number) => number): C {
    return {
        ...c,
        entryM: toX(c.entryM),
        apexM: toX(c.apexM),
        exitM: toX(c.exitM),
        brakingPointM: c.brakingPointM == null ? c.brakingPointM : toX(c.brakingPointM),
        throttleOnM: c.throttleOnM == null ? c.throttleOnM : toX(c.throttleOnM),
    };
}
