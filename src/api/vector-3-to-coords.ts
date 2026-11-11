import { MathUtils, Vector3Tuple } from "three";
import { Coords, CoordsOptions } from "./coords";
import { radiiOfCurvature } from "../core/radii-of-curvature";

export function vector3ToCoords(position: Vector3Tuple, origin: Coords, options?: CoordsOptions): Coords {
  const [x, y, z] = position;
  const radii = radiiOfCurvature(origin.latitude, options?.ellipsoid);
  const latitude = origin.latitude + (-z / radii.north) * MathUtils.RAD2DEG;
  const longitude = origin.longitude + (x / radii.east) * MathUtils.RAD2DEG / Math.cos(origin.latitude * MathUtils.DEG2RAD);
  const altitude = (origin.altitude || 0) + y;
  const coords: Coords = { latitude, longitude, altitude };
  return coords;
}