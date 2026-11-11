import { RootState, _roots, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { UseBoundStore } from 'zustand';
import { Coords, CoordsOptions } from "../api/coords";

export function useCoords() {
  const coords = useThree(s=>(s as any).coords) as Coords & CoordsOptions; // eslint-disable-line @typescript-eslint/no-explicit-any
  return coords;
}

/** the `ellipsoid` option of the `<Canvas>`, without re-rendering when its coordinates change */
export function useEllipsoid() {
  return useThree(s=>(s as any).coords?.ellipsoid) as CoordsOptions['ellipsoid']; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function useSetCoords({longitude, latitude, altitude, ellipsoid}: Coords & CoordsOptions) {
  
  const canvas = useThree(s => s.gl.domElement);
  useMemo(()=>{
    const store = _roots.get(canvas)!.store; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const coords : Coords & CoordsOptions = { longitude, latitude, altitude, ellipsoid };
    setCoords(store, coords);
  }, [longitude, latitude, altitude, ellipsoid]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function useSetRootCoords(store:UseBoundStore<RootState>, {
  longitude, latitude, altitude, ellipsoid
}: Coords & CoordsOptions) {
  useMemo(()=>{
    setCoords(store, {longitude, latitude, altitude, ellipsoid});
  }, [longitude, latitude, altitude, ellipsoid]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function setCoords(store:UseBoundStore<RootState>, coords: Coords & CoordsOptions) {
  store.setState({coords} as any) // eslint-disable-line @typescript-eslint/no-explicit-any
}