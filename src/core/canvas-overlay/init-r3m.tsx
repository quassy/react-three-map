import { memo } from "react";
import { FromLngLat, MapInstance } from "../generic-map";
import { useInitR3M } from "../use-r3m";
import { useSetCoords } from "../use-coords";
import { Coords, CoordsOptions } from "../../api/coords";

interface InitR3MProps extends Coords, CoordsOptions {
  map: MapInstance,
  fromLngLat: FromLngLat,
}

/** Initialises the `R3M` hook */
export const InitR3M = memo<InitR3MProps>(({
  longitude, latitude, altitude, ellipsoid, ...props
}) => {
  useInitR3M(props);
  useSetCoords({longitude, latitude, altitude, ellipsoid});
  return <></>
})
InitR3M.displayName = 'InitR3M';