import { MathUtils } from "three";
import { earthRadius } from "./earth-radius";

/** WGS84 semi-major axis, in meters */
const semiMajorAxis = 6378137;
/** WGS84 flattening */
const flattening = 1 / 298.257223563;
/** WGS84 first eccentricity squared */
const eccentricitySquared = flattening * (2 - flattening);

/**
 * Radii of curvature at a latitude, in meters, east-west (`east`) and north-south (`north`):
 * the sphere's of Mapbox and MapLibre, or with `ellipsoid` the WGS84 ellipsoid's.
 *
 * A step of longitude in radians is `east * cos(latitude)` meters long, a step of latitude `north` meters.
 */
export function radiiOfCurvature(latitude: number, ellipsoid?: boolean) {
  if (!ellipsoid) return { east: earthRadius, north: earthRadius };
  const sinLatitude = Math.sin(latitude * MathUtils.DEG2RAD);
  const w = Math.sqrt(1 - eccentricitySquared * sinLatitude * sinLatitude);
  return {
    east: semiMajorAxis / w,
    north: semiMajorAxis * (1 - eccentricitySquared) / (w * w * w),
  };
}
