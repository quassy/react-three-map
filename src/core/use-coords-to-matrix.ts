import { useMemo } from "react";
import { coordsToMatrix } from "./coords-to-matrix";

type Props = Parameters<typeof coordsToMatrix>[0];

/** calculate matrix from coordinates */
export function useCoordsToMatrix({latitude, longitude, altitude, fromLngLat, ellipsoid}: Props) {
  const m4 = useMemo(() => coordsToMatrix({
    latitude, longitude, altitude, fromLngLat, ellipsoid,
  }), [latitude, longitude, altitude, fromLngLat, ellipsoid]);

  return m4;
}