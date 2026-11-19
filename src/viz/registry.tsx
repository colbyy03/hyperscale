/** Named interactive explainers usable from MDX as <Viz name="..." />. Each is code-split. */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type AnyProps = Record<string, unknown>;

export const vizRegistry: Record<string, LazyExoticComponent<ComponentType<AnyProps>>> = {
  PueCalculator: lazy(() => import("./PueCalculator")),
  HeatPath: lazy(() => import("./HeatPath")),
  ControlRoom: lazy(() => import("./ControlRoom")),
  StrideExplorer: lazy(() => import("./StrideExplorer")),
  MatrixMap: lazy(() => import("./MatrixMap")),
  ProjectionViz: lazy(() => import("./ProjectionViz")),
  FieldModes: lazy(() => import("./FieldModes")),
};
