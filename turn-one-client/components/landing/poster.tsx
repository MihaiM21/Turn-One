import { CAR } from "./data";

/**
 * SSR'd still of the wind-tunnel scene — the LCP element under the 3D stage,
 * and what reduced-motion / no-JS / low-end devices get.
 *
 * The stills are rendered from the live scene at its starting camera (see
 * CAR.posters), and placed with the same rules the canvas uses, so the 3D
 * fades in over an identical frame:
 *  - height-locked, because the camera's FOV is vertical (the canvas shows
 *    more or less at the sides as the aspect changes, never at top/bottom);
 *  - ≥1024px: the car's centre sits at 70% of the width (ViewShift's 0.2 push);
 *  - portrait: the 50° portrait still, lifted by 20% of the height (ViewShift's dy).
 * Edges are feathered for the aspect ratios where the still is narrower than the screen.
 */
export function Poster() {
  return (
    <picture>
      <source media="(orientation: portrait)" srcSet={CAR.posters.portrait} width={1080} height={1920} />
      <img
        src={CAR.posters.landscape}
        alt="The 2026 Turn One car in a wind tunnel, cyan airflow streaming over the bodywork"
        width={1920}
        height={1080}
        fetchPriority="high"
        decoding="async"
        className="absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2 portrait:-translate-y-[20%] lg:left-[70%] [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]"
      />
    </picture>
  );
}
