import { RenderProps } from "@react-three/fiber";
import { PropsWithChildren } from "react";
import { Coords, CoordsOptions } from "./coords";

export interface CanvasProps extends Coords, CoordsOptions, Omit<RenderProps<HTMLCanvasElement>, 'frameloop'>, PropsWithChildren {
  id?: string;
  beforeId?: string;
  frameloop?: 'always' | 'demand',
  /** render on a separated `<canvas>` that sits on top of the map provider */
  overlay?: boolean,
}
