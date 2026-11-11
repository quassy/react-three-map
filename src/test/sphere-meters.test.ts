import { MercatorCoordinate as MercatorCoordinateBox } from "mapbox-gl";
import { MercatorCoordinate as MercatorCoordinateLibre } from "maplibre-gl";
import { Vector3Tuple } from "three";
import { expect, it } from 'vitest';
import { Coords } from "../api/coords";
import { coordsToVector3 } from "../api/coords-to-vector-3";
import { vector3ToCoords } from "../api/vector-3-to-coords";
import { coordsToMatrix } from "../core/coords-to-matrix";

// The snapshot was written by react-three-map 1.0.2, before the `ellipsoid` option existed.
// Keep these calls in their own file: `coordsToVector3` caches Mercator scales per 0.001° of latitude,
// so calls made before them would change their results.

const origins: Coords[] = [
  { latitude: 48.137, longitude: 11.575, altitude: 520 },
  { latitude: -22.91, longitude: -43.17 },
];

const points: Coords[] = [
  { latitude: 48.138, longitude: 11.5765, altitude: 530 },
  { latitude: 48.128, longitude: 11.562 },
  { latitude: 52.52, longitude: 13.405 },
  { latitude: -33.87, longitude: 151.21 },
];

const vectors: Vector3Tuple[] = [
  [0, 0, 0],
  [100, 10, -50],
  [-1000, 0, 1000],
  [250000, 0, -480000],
];

it('keeps the sphere meters of 1.0.2 without the ellipsoid option', () => {
  const results = [undefined, { ellipsoid: false }].map(options => ({
    options,
    coordsToMatrix: origins.flatMap(origin => (
      [MercatorCoordinateBox.fromLngLat, MercatorCoordinateLibre.fromLngLat].map(fromLngLat => (
        coordsToMatrix({ ...origin, fromLngLat, ...options })
      ))
    )),
    coordsToVector3: origins.flatMap(origin => points.map(point => coordsToVector3(point, origin, options))),
    vector3ToCoords: origins.flatMap(origin => vectors.map(vector => vector3ToCoords(vector, origin, options))),
  }));
  expect(results).toMatchFileSnapshot('./__snapshots__/sphere-meters.json');
})
