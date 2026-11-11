
export interface Coords {
  longitude: number;
  latitude: number;
  altitude?: number;
}

export interface CoordsOptions {
  /**
   * Measure x (east) and z (south) in meters on the WGS84 ellipsoid at the origin, instead of the map's
   * meters, which Mapbox and MapLibre take on a 6,371,008.8 m sphere and which are up to 0.56 % off on
   * the ground. y (up) keeps the map's meters.
   * @default false
   */
  ellipsoid?: boolean;
}
