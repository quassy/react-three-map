import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { FromLngLat } from "./generic-map";
import { Coords, CoordsOptions } from "../api/coords";
import { earthRadius } from "./earth-radius";
import { radiiOfCurvature } from "./radii-of-curvature";

const quat = new Quaternion();
const euler = new Euler();
const pos = new Vector3();
const scale = new Vector3();
const m4 = new Matrix4();

/** calculate Matrix4 from coordinates */
export function coordsToMatrix({
  longitude, latitude, altitude, fromLngLat, ellipsoid
}: Coords & CoordsOptions & { fromLngLat: FromLngLat }) {
  const center = fromLngLat([longitude, latitude], altitude);
  // a meter of the map, which is a meter on a sphere of `earthRadius`
  const scaleUnit = center.meterInMercatorCoordinateUnits();
  const { east, north } = radiiOfCurvature(latitude, ellipsoid);
  pos.set(center.x, center.y, center.z || 0);
  // the scene's x points east, its y up and its z south
  scale.set(scaleUnit * (earthRadius / east), -scaleUnit, scaleUnit * (earthRadius / north));
  quat.setFromEuler(euler.set(-Math.PI * .5, 0, 0));
  return m4.compose(pos, quat, scale).toArray();
}
