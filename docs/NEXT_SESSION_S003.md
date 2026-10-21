# Geometry Maths Playground — S003: 3D Cross-Sections, Nets and Geometric Invariants

**Repository:** https://github.com/jfairfaxball-348/geometry-maths-playground
**Live application:** https://geometry-maths-playground.vercel.app/

## Objective

Implement the next mathematics-first version of the existing 2D/3D playground. S002 added eight 3D solids, constrained direct manipulation, transformations and live volume/surface-area calculations. S003 must explore what happens *inside* those solids: cross-sections, changing areas and volumes, nets, and rigorous visual demonstrations of invariants.

**This is a code implementation session. Inspect the current repository, write working code, test it and commit it. Do not stop at a design proposal.**

## 1. Preserve and verify S001–S002

- Keep every current 2D feature, the 2D/3D switch, all eight solids, numeric dimension inputs, drag-to-resize handles, camera orbit/pan/zoom, transform modes and mathematical interpretation.
- Run and fix npm run check, npm test and npm run build before and after modifications.
- Validate in an actual browser, including desktop pointer interactions and a mobile-sized viewport if browser tooling is available.
- Make the browser dependency strategy robust: review the pinned Three.js import map and report offline limitations. Prefer a reproducible local bundle if that improves reliability without overcomplicating the stack.
- Never claim a browser test was performed unless it was.

## 2. Interactive slicing plane (highest priority)

- Add a user-controlled infinite plane that intersects a selected solid.
- Move the plane along its normal using a drag handle and a precise signed-distance slider.
- Rotate the plane about at least two axes using direct handles or numeric controls.
- Display a genuine geometric intersection polygon/curve, not a decorative translucent disc.
- Compute intersection geometry for cube/cuboid, tetrahedron, pyramid and triangular prism using robust segment-plane intersections. Deduplicate vertices, order them in the plane, handle vertex/edge tangencies, and correctly report no-intersection cases.
- For sphere, cylinder and cone, implement analytically correct common sections (e.g. horizontal slices) before extending to tilted/oblique slices. Clearly mark any unsupported oblique case rather than display an incorrect cross-section.
- Show the cross-section in a contrasting colour, with optional 2D flattened inset and a measurement for area, perimeter, edge lengths and classification where justified.
- Ensure clipping/display controls do not corrupt solid volume measurements.

## 3. Mathematical experiments and invariants

- Enable experiments comparing cross-sectional area against height.
- For a sphere, show the horizontal slice area A(z) = π(R² − z²) with actual substituted values.
- For a right circular cone, show the quadratic change in area with distance from the apex.
- For prisms and cylinders, show constant parallel cross-sectional area.
- Explain Cavalieri's principle through a concise experiment with two solids of equal height and matching area profiles (where justified).
- Add a small interactive plot A(z) where the slicing slider's current location is highlighted; avoid heavyweight graph dependencies if unnecessary.
- Demonstrate volume as accumulated cross-sectional area, with numerical integration only where error bounds or convergence are made clear.

## 4. Nets and surface area

- Add a toggle for an unfolded net for at least a cube, cuboid and square pyramid.
- Show face dimensions and the sum of their areas.
- Keep total surface area consistent with the 3D mathematical panel.
- Avoid claiming mathematically impossible nets for curved surfaces; label cylinder/cone developments separately if implemented.

## 5. Improve direct geometry editing

- Improve depth-resize handle visibility, feedback and hit targets on mobile.
- Consider constrained vertex editing of tetrahedron, pyramid and prism only when the chosen parameterisation can be maintained correctly; if introducing free-vertex editing, compute measurements directly from mesh vertices and verify closed oriented mesh topology.
- Prevent inverted or self-intersecting solids and accidental orbit versus edit gestures.
- Provide reset-slice, reset-camera and reset-solid actions.

## 6. Mathematical correctness and tests

- Keep maths, intersection algorithms and rendering separate.
- Add tests for cube plane sections (square, rectangle, hexagon cases), sphere equatorial and near-polar areas, prism constant-area slices, cone radius/area scaling and polygon plane projection.
- Test translation/rotation invariance, uniform scale laws and Euler characteristic for closed convex polyhedra.
- Test degeneracy: plane through a vertex, tangent plane, coincident face plane and empty section.
- Test rendered geometry consistency with the same canonical shape parameters that feed volume calculations.
- Do not equate triangulated rendering faces with intrinsic mathematical face counts.

## 7. User experience and performance

- Preserve V1/V2 light visual language, readable mathematics panel and responsive layout.
- Prioritise a large geometry workspace and intuitive gestures; keep settings secondary.
- Render on demand, dispose geometries/materials, and avoid endless animation loops.
- No authentication, database, API keys, paid services or backend.
- Keep the existing Vercel static deployment working.

## 8. Completion and closeout

Commit working changes in jfairfaxball-348/geometry-maths-playground, with a clear summary of changes and evidence of executed tests/builds. State exactly which slicing orientations/shapes are supported and which remain incomplete. Do not treat an unverified visual as a passing browser test. Confirm whether main is safe to redeploy to Vercel.

Produce the full S004 next-session prompt. **Guiding principle:** every graphic must be driven by real geometry, and every mathematical claim must match what the user can manipulate.
