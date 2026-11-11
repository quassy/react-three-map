---
"react-three-map": minor
---

Add an opt-in `ellipsoid` prop to `<Canvas>`, and an `{ ellipsoid }` option to `coordsToVector3` and `vector3ToCoords`. With it, the scene's x and z axes are in meters on the WGS84 ellipsoid at the canvas origin, instead of the map's own meters, which Mapbox and MapLibre take on a 6,371,008.8 m sphere and which are 0.3 % too long east-west at 50°N. Without it, nothing changes.
