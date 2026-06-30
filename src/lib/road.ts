export const ROAD_W = 1000;
export const ROAD_H = 6400;

// Centerline waypoints in viewBox space. The road snakes left<->right
// as it descends. x in [0, ROAD_W], y in [0, ROAD_H].
export const WAYPOINTS: [number, number][] = [
  [560, -120],
  [600, 380],
  [430, 900],
  [560, 1450],
  [690, 2000],
  [440, 2560],
  [330, 3120],
  [540, 3680],
  [690, 4240],
  [470, 4800],
  [400, 5360],
  [560, 5920],
  [600, 6520],
];

/**
 * Smooth centerline through waypoints using a Catmull-Rom spline
 * converted to cubic beziers.
 */
export function buildRoadPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  const p = points;
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export const ROAD_PATH = buildRoadPath(WAYPOINTS);
