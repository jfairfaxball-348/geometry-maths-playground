# Geometry Maths Playground — S003: Direct 3D Vertex Editing, Independent Tools Panel, Cross-Sections and Nets

**Repository:** https://github.com/jfairfaxball-348/geometry-maths-playground
**Live application:** https://geometry-maths-playground.vercel.app/

## Objective

Implement the next mathematics-first version of the existing 2D/3D playground. S002 added eight 3D solids, constrained dimension manipulation, transformations and live volume/surface-area calculations. **First correct the two interaction gaps:** an independently scrollable left tool panel and genuinely draggable 3D vertices/points, like the existing 2D vertex handles. Then explore what happens *inside* solids: cross-sections, changing areas and volumes, nets, and visual demonstrations of invariants.

**This is a code implementation session. Inspect the current repository, write working code, test it and commit it. Do not stop at a design proposal.**

## 1. Preserve and verify S001–S002

- Keep every current 2D feature, the 2D/3D switch, all eight solids, numeric dimension inputs, drag-to-resize handles, camera orbit/pan/zoom, transform modes and mathematical interpretation.
- Run and fix npm run check, npm test and npm run build before and after modifications.
- Validate in an actual browser, including desktop pointer interactions and a mobile-sized viewport if browser tooling is available.
- Make the browser dependency strategy robust: review the pinned Three.js import map and report offline limitations. Prefer a reproducible local bundle if that improves reliability without overcomplicating the stack.
- Never claim a browser test was performed unless it was.

## 2. Independently scrollable left tool panel (required UX fix)

- On desktop, the **left tools panel must have its own vertical scrollbar** and be independently scrollable by mouse wheel, trackpad, touch, keyboard and scrollbar thumb. Users must reach dimension, position, rotation and display controls at the bottom of the left column without moving the middle geometry workspace or the right mathematics panel.
- Keep the central geometry/camera and right live-maths column visually stationary when the user scrolls *inside* the left menu. Size the desktop workspace/panel relative to available viewport height; use `overflow-y: auto` (or equivalent), with predictable scroll containment and an unobtrusive visible scrollbar.
- Preserve the current light visual language, reasonable minimum heights and access to every control. Do not make the menu into an overlay covering the 3D scene.
- On small/mobile layouts where panels stack, allow ordinary page scrolling so nothing is trapped or clipped; do not force three independent tiny scroll areas.
- Verify scrolling after expanding the 3D shape/dimension controls and after switching 2D ⇄ 3D. Confirm scroll position or intentional reset behaviour is sensible and the page remains keyboard-accessible.

## 3. Genuine 3D point/vertex dragging (highest geometry priority)

**This is not satisfied by S002's dimensional resize handles or by dragging to rotate the camera.** Reproduce the spirit of the V1 2D playground: click a visible vertex point, drag it, and see the solid actually change shape.

- Add a clear **Edit vertices / Edit points** interaction mode, with visible hoverable/grabbable handles on real polyhedron vertices. Hover/select a handle, pointer-down, drag to a new position, and release to commit; the mesh updates continuously, as do its edges and mathematical measurements.
- Implement fully functional **independent vertex movement for the tetrahedron first**: individual corner movement must change the actual vertex coordinates and edge lengths, not just translate/rotate/scale or uniformly resize the whole solid. The resulting tetrahedron must have valid nonzero signed volume and correctly measured triangular faces.
- Extend where geometrically valid to the square pyramid and triangular prism. Explain/indicate constraints (for example, planar polygonal faces, shared vertices and convexity); reject or clamp drags that produce inverted, collapsed, open or self-intersecting solids. If unrestricted vertices make pyramid/prism faces non-planar, either enforce a clear valid geometric constraint or triangulate with accurately named resulting polyhedron and formulas—never silently retain the original shape label or an invalid textbook formula.
- For cubes/cuboids, enable corner grabs where practical, but keep them constrained to valid editable dimensions unless a verified general polyhedral model is implemented. Dragging one corner to change only width/height/depth is acceptable if it is visibly disclosed as *constrained* editing; it does **not** count toward the independent-vertex completion criterion above.
- For spheres, cones and cylinders, keep radius/height handles rather than presenting fictitious independent vertices. Their defining geometric constraints must remain intact.
- Use a well-defined raycast and 3D drag-plane or axis-gizmo method; on dragging, distinguish screen-plane movement from moving in depth (e.g. a selectable XY/XZ/YZ plane or a depth-axis modifier). Provide numeric X/Y/Z coordinate readouts and precise inputs for the selected vertex.
- Suspend camera orbit while a vertex is actively dragged and restore it reliably on release/cancel or mode change. Keep touch/pointer capture, mobile hit targets, mode indicators and clear feedback robust.
- Derive volume from the **edited vertices/faces** (for example, an oriented tetrahedral decomposition or equivalent validated polyhedron algorithm); compute surface area from actual faces and edge lengths from actual coordinates. Update classifications and mathematical formulas to match the edited geometry. Do not continue displaying S002 analytic regular-shape formulas once a solid has been freely deformed.
- Show an educational note about what changes when a single corner moves versus which properties remain invariant under rigid movement. Preserve reset-to-canonical-shape and undo/cancel behaviour as practical.

## 4. Interactive slicing plane (highest mathematical priority)

- Add a user-controlled infinite plane that intersects a selected solid.
- Move the plane along its normal using a drag handle and a precise signed-distance slider.
- Rotate the plane about at least two axes using direct handles or numeric controls.
- Display a genuine geometric intersection polygon/curve, not a decorative translucent disc.
- Compute intersection geometry for cube/cuboid, tetrahedron, pyramid and triangular prism using robust segment-plane intersections. Deduplicate vertices, order them in the plane, handle vertex/edge tangencies, and correctly report no-intersection cases.
- For sphere, cylinder and cone, implement analytically correct common sections (e.g. horizontal slices) before extending to tilted/oblique slices. Clearly mark any unsupported oblique case rather than display an incorrect cross-section.
- Show the cross-section in a contrasting colour, with optional 2D flattened inset and a measurement for area, perimeter, edge lengths and classification where justified.
- Ensure clipping/display controls do not corrupt solid volume measurements.

## 5. Mathematical experiments and invariants

- Enable experiments comparing cross-sectional area against height.
- For a sphere, show the horizontal slice area A(z) = π(R² − z²) with actual substituted values.
- For a right circular cone, show the quadratic change in area with distance from the apex.
- For prisms and cylinders, show constant parallel cross-sectional area.
- Explain Cavalieri's principle through a concise experiment with two solids of equal height and matching area profiles (where justified).
- Add a small interactive plot A(z) where the slicing slider's current location is highlighted; avoid heavyweight graph dependencies if unnecessary.
- Demonstrate volume as accumulated cross-sectional area, with numerical integration only where error bounds or convergence are made clear.

## 6. Nets and surface area

- Add a toggle for an unfolded net for at least a cube, cuboid and square pyramid.
- Show face dimensions and the sum of their areas.
- Keep total surface area consistent with the 3D mathematical panel.
- Avoid claiming mathematically impossible nets for curved surfaces; label cylinder/cone developments separately if implemented.

## 7. Interaction polish

- Improve depth-resize handle visibility, feedback and hit targets on mobile, alongside the new per-vertex handles.
- Prevent accidental camera orbit versus point editing versus slicing-plane manipulation by making modes explicit.
- Provide reset-slice, reset-camera and reset-solid actions.
- Ensure a user can independently scroll the left control panel while manipulating the 3D scene or reading the live mathematics panel.

## 8. Mathematical correctness and tests

- Keep maths, intersection algorithms and rendering separate.
- Add tests of arbitrary edited tetrahedron vertex coordinates, changed edge lengths, exact determinant volume, triangle-face surface area, signed orientation and rejection of degenerate/collapsed results.
- Add regression coverage for the 2D/3D view swap and an independent left-panel scroll layout (browser interaction/viewport verification if available).
- Add tests for cube plane sections (square, rectangle, hexagon cases), sphere equatorial and near-polar areas, prism constant-area slices, cone radius/area scaling and polygon plane projection.
- Test translation/rotation invariance, uniform scale laws and Euler characteristic for closed convex polyhedra.
- Test degeneracy: plane through a vertex, tangent plane, coincident face plane and empty section.
- Test rendered geometry consistency with the same canonical shape parameters that feed volume calculations.
- Do not equate triangulated rendering faces with intrinsic mathematical face counts.

## 9. User experience and performance

- Preserve V1/V2 light visual language, readable mathematics panel and responsive layout.
- Prioritise a large geometry workspace and intuitive gestures; keep settings secondary.
- Render on demand, dispose geometries/materials, and avoid endless animation loops.
- No authentication, database, API keys, paid services or backend.
- Keep the existing Vercel static deployment working.

## 10. Acceptance criteria and closeout

S003 is **not complete** unless these two user-requested behaviours are verified:

1. On a desktop-sized viewport, the left column scrolls independently through all controls; scrolling the left column does not displace the middle 3D workspace or right mathematics panel, and the mobile stacked layout remains usable.
2. In 3D, at least one real polyhedron (the tetrahedron) allows the user to click and drag **an individual vertex independently** of the others; its 3D coordinates, mesh, edge lengths, surface area and volume recompute live. Constrained dimension grips alone do not satisfy this criterion.

Preserve the existing slicing, nets and mathematical experiments objectives; prioritise a polished working implementation over superficially checking every box. If slicing/nets cannot be completed alongside these two requirements, report the precise deferral and carry it forward to S004.



Commit working changes in jfairfaxball-348/geometry-maths-playground, with a clear summary of changes and evidence of executed tests/builds. State exactly which slicing orientations/shapes are supported and which remain incomplete. Do not treat an unverified visual as a passing browser test. Confirm whether main is safe to redeploy to Vercel.

Produce the full S004 next-session prompt. **Guiding principle:** every graphic must be driven by real geometry, and every mathematical claim must match what the user can manipulate.
