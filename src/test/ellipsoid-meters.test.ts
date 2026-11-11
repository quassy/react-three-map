import { MercatorCoordinate as MercatorCoordinateBox } from "mapbox-gl";
import { MercatorCoordinate as MercatorCoordinateLibre } from "maplibre-gl";
import { Matrix4, PerspectiveCamera, Plane, Raycaster, Vector2, Vector3, Vector3Tuple } from "three";
import { describe, expect, it, vi } from 'vitest';
import { Coords } from "../api/coords";
import { vector3ToCoords } from "../api/vector-3-to-coords";
import { coordsToMatrix } from "../core/coords-to-matrix";
import { events } from "../core/events";
import { FromLngLat } from "../core/generic-map";
import { syncCamera } from "../core/sync-camera";
import { Geodesic, geodesics } from "./geodesics";

// react-three-map's pointer events only extend R3F's, and loading R3F here would load a second copy of three.
vi.mock('@react-three/fiber', () => ({ events: () => ({}) }));

// Web Mercator's scale grows with latitude: a scene line from the origin to a point 1 km north of 60°N is
// 0.014 % longer than the line on the ground, with or without the `ellipsoid` option. The geodesics have
// their midpoint at the origin, where that growth cancels out, so their scene length measures the scene
// unit at the origin.

const providers: [string, FromLngLat][] = [
  ['mapbox', MercatorCoordinateBox.fromLngLat],
  ['maplibre', MercatorCoordinateLibre.fromLngLat],
];

const options = { ellipsoid: true };

/** the geodesics whose scene length is off by more than 1e-5, with their relative error */
function lengthErrors(sceneLength: (geodesic: Geodesic) => number) {
  return geodesics
    .map(geodesic => ({
      geodesic: `${geodesic.length} m at ${geodesic.azimuth}° through ${geodesic.origin.latitude}°`,
      error: sceneLength(geodesic) / geodesic.length - 1,
    }))
    .filter(({ error }) => !(Math.abs(error) <= 1e-5));
}

/**
 * `coordsToVector3` with an empty cache. It averages Web Mercator's scale from values it caches per 0.001° of
 * latitude, each off by less than tan(latitude) × 0.001° (3.0e-5 at 60°N), so earlier calls change its results.
 */
async function freshCoordsToVector3() {
  vi.resetModules();
  return (await import("../api/coords-to-vector-3")).coordsToVector3;
}

/** where the canvas matrix renders `point`, in scene units */
function matrixScenePosition(point: Coords, origin: Coords, fromLngLat: FromLngLat) {
  const toScene = new Matrix4().fromArray(coordsToMatrix({ ...origin, fromLngLat, ...options })).invert();
  const { x, y, z } = fromLngLat([point.longitude, point.latitude], point.altitude);
  return new Vector3(x, y, z ?? 0).applyMatrix4(toScene);
}

/** where a pointer over a point of the map hits the scene's ground, seen from 4 km away at a 60° pitch */
function pointerHits(origin: Coords, fromLngLat: FromLngLat) {
  const size = { width: 1024, height: 768 };
  const center = fromLngLat([origin.longitude, origin.latitude]);
  const distance = 4000 * center.meterInMercatorCoordinateUnits();
  const pitch = Math.PI / 3;
  const mapCamera = new PerspectiveCamera(60, size.width / size.height, distance / 100, distance * 100);
  mapCamera.up.set(0, 0, 1);
  mapCamera.position.set(center.x, center.y + distance * Math.sin(pitch), distance * Math.cos(pitch));
  mapCamera.lookAt(center.x, center.y, 0);
  mapCamera.updateMatrixWorld();
  const viewProjection = new Matrix4().multiplyMatrices(mapCamera.projectionMatrix, mapCamera.matrixWorldInverse);

  const camera = new PerspectiveCamera();
  syncCamera(camera, coordsToMatrix({ ...origin, fromLngLat, ...options }), viewProjection.toArray());

  // only R3F's own handlers, mocked above, read the store
  const compute = events?.({} as never).compute;
  if (!compute) throw new Error('react-three-map events have no compute function');
  const state = { size, camera, pointer: new Vector2(), raycaster: new Raycaster() };
  const ground = new Plane(new Vector3(0, 1, 0), 0);

  return (point: Coords) => {
    const { x, y } = fromLngLat([point.longitude, point.latitude]);
    const ndc = new Vector3(x, y, 0).applyMatrix4(viewProjection);
    compute({
      offsetX: (ndc.x + 1) / 2 * size.width,
      offsetY: (1 - ndc.y) / 2 * size.height,
    } as never, state as never);
    const hit = state.raycaster.ray.intersectPlane(ground, new Vector3());
    if (!hit) throw new Error(`pointer over ${point.latitude}, ${point.longitude} misses the ground`);
    return hit;
  };
}

describe('<Canvas ellipsoid>', () => {

  it.each(providers)('renders a scene meter as a WGS84 meter at the origin with %s', (_, fromLngLat) => {
    expect(lengthErrors(({ origin, from, to }) => (
      matrixScenePosition(from, origin, fromLngLat).distanceTo(matrixScenePosition(to, origin, fromLngLat))
    ))).toEqual([]);
  });

  it.each(providers)('keeps meters of altitude on the y axis with %s', (_, fromLngLat) => {
    for (const latitude of [0, 48, 60]) {
      const origin = { latitude, longitude: 10 };
      expect(matrixScenePosition({ ...origin, altitude: 100 }, origin, fromLngLat).y).toBeCloseTo(100, 9);
    }
  });

  it.each(providers)('gives pointer events in WGS84 meters with %s', (_, fromLngLat) => {
    expect(lengthErrors(({ origin, from, to }) => {
      const hit = pointerHits(origin, fromLngLat);
      return hit(from).distanceTo(hit(to));
    })).toEqual([]);
  });

});

describe('coordsToVector3 with ellipsoid', () => {

  it('measures geodesics through the origin in WGS84 meters', async () => {
    const coordsToVector3 = await freshCoordsToVector3();
    expect(lengthErrors(({ origin, from, to }) => (
      new Vector3(...coordsToVector3(from, origin, options)).distanceTo(new Vector3(...coordsToVector3(to, origin, options)))
    ))).toEqual([]);
  });

  it.each(providers)('places points where the canvas matrix renders them with %s', async (_, fromLngLat) => {
    // the matrix follows Web Mercator exactly, so the cached scales can put a point up to 3.0e-5 of its
    // distance from the origin away, with or without the option
    const coordsToVector3 = await freshCoordsToVector3();
    const misplaced = geodesics.flatMap(({ origin, from, to, length }) => [from, to].map(point => ({
      point,
      error: new Vector3(...coordsToVector3(point, origin, options))
        .distanceTo(matrixScenePosition(point, origin, fromLngLat)) / (length / 2),
    }))).filter(({ error }) => !(error <= 4e-5));
    expect(misplaced).toEqual([]);
  });

  it('keeps the altitude difference on the y axis', async () => {
    const coordsToVector3 = await freshCoordsToVector3();
    const origin = { latitude: 48, longitude: 11, altitude: 100 };
    expect(coordsToVector3({ ...origin, altitude: 130 }, origin, options)[1]).toBe(30);
  });

});

describe('vector3ToCoords with ellipsoid', () => {

  const origins: Coords[] = [
    { latitude: 0, longitude: 10 },
    { latitude: 48, longitude: 11, altitude: 500 },
    { latitude: 60, longitude: 25 },
    { latitude: -34, longitude: 151 },
  ];

  const vectors: Vector3Tuple[] = [
    [100, 25, 0], [70.71, 25, -70.71], [0, 25, -100], [-70.71, 25, -70.71],
    [-100, 25, 0], [-70.71, 25, 70.71], [0, 25, 100], [70.71, 25, 70.71],
  ];

  it('round-trips scene positions 100 m from the origin through coordsToVector3 within 5 mm', async () => {
    // vector3ToCoords leaves out Web Mercator's scale change, as without the option: 100 m north or south
    // of 60°N, that drifts 1.4 mm, and the cached scales add up to 3 mm
    const coordsToVector3 = await freshCoordsToVector3();
    const drifted = origins.flatMap(origin => vectors.map(vector => ({
      origin,
      vector,
      drift: new Vector3(...coordsToVector3(vector3ToCoords(vector, origin, options), origin, options))
        .distanceTo(new Vector3(...vector)),
    }))).filter(({ drift }) => !(drift < 0.005));
    expect(drifted).toEqual([]);
  });

});
