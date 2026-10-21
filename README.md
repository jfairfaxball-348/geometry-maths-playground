# Geometry Maths Playground

An interactive, browser-based geometry laboratory: move shapes, manipulate their vertices, and see the mathematics change immediately.

## Mission

Build a friendly visual maths playground, not a static collection of diagrams. Start with interactive Euclidean geometry; progressively add constructions, coordinate geometry, transformations and further mathematical explorations.

## S001 — Interactive 2D starter

- Drag vertices or a whole shape directly on a coordinate grid.
- Explore triangles, rectangles, squares, quadrilaterals, circles and regular polygons.
- See perimeter, area, side lengths, angles, classification and formulae recompute live.
- Experiment with rotations, reflections and scale to observe invariants.
- Responsive interface suitable for mouse and touch; no account, backend or API key.

## S002 — Interactive 3D laboratory

- Switch between the preserved S001 SVG 2D playground and a Three.js 3D workspace.
- Orbit, pan, zoom and reset a perspective camera; optional axes/grid and solid, transparent and wireframe views.
- Explore cube, cuboid, sphere, cylinder, cone, tetrahedron, square pyramid and equilateral triangular prism.
- Drag dimension handles in **Resize** mode; stretching a cube along one axis converts it to a cuboid. Use **Move**, **Rotate** and **Scale** for object transforms, or enter exact dimensions and coordinates.
- See accurate analytic volume, surface area, face/edge/vertex counts on polyhedra, relevant formula substitutions and dynamic scaling/invariant observations.
- Geometry calculations live in `src/solids.mjs`; rendering in `src/three-workspace.js` and pure editable-tetrahedron maths in `src/tetra-vertices.mjs`. Euler's V − E + F = 2 applies to the five convex polyhedra, not smooth shapes.
- Three.js is lazily imported from locally hosted, version-pinned Three.js modules when the 3D tab is opened. **No third-party CDN is required.** An initial site load still requires network access. WebGL must be enabled in the browser.

## S003 — Direct tetrahedron corner editing and independent tools scrolling

- On desktop, the left tools column scrolls by itself without moving the middle geometry workspace or right mathematics panel. On smaller screens normal stacked scrolling is preserved.
- In 3D, choose **Tetrahedron → Edit points**. Drag any of the four coloured vertex markers independently. Use a screen-facing drag plane or XY/XZ/YZ for depth control, plus numerical object-local X/Y/Z coordinate inputs.
- The tetrahedron's actual vertex positions drive the rendered triangles, six edge lengths, four face areas, surface area and determinant volume. Collapsed and inverted solids are rejected.
- The point-editing mode is intentionally available only for tetrahedra; cubes, prisms, pyramids and curved solids keep their existing dimension handles. Changing the tetrahedron's regular side input resets its four vertices.
- Undo the last point edit, or reset the solid for the canonical regular tetrahedron.
- Cutting planes and Cavalieri experiments remain planned; animated box nets are delivered in S004.

## S004 — Animated 3D folding nets and live 2D surface area

- Select **3D laboratory → Cube/Cuboid → Unfold net**. Use the **Unfold** and **Fold** buttons or scrub the progress slider. Orbit the solid freely at every stage.
- Six real planar face meshes rotate around **five connected hinges**: the front face stays fixed while the back face hinges from the top face. Fully unfolded, all six rectangles form one connected nonoverlapping planar cross.
- The right maths panel shows a colour-matched 2D net, six selectable face areas, and their exact sum. Clicking a face row highlights that same face on the 3D model.
- Changing cube/cuboid dimensions or uniform scale rebuilds the net and recalculates the face areas. The preserved invariant is **surface area**, not enclosed volume during unfolding.
- Pure maths is in `src/box-nets.mjs`; hinge rendering is in `src/folding-box.js`; automated tests verify nonoverlap, edge joins, face pairs, scaling and equality with the solid’s surface area.
- The **Unfold net** option is intentionally limited to **cube and cuboid** for S004. Nets for tetrahedra, pyramids and prisms are possible next; curved surfaces require fundamentally different methods.

## Run locally

Requires Node.js 20 or later. Install the pinned Three.js dependency before running or building; the static build copies the required modules to the same origin as the application.

    npm install
    npm run dev

Visit http://localhost:5173.

Quality checks:

    npm run check
    npm test
    npm run build

## Deploy to Vercel

Import the GitHub repository jfairfaxball-348/geometry-maths-playground into Vercel. Choose **Other** as the framework preset if not selected automatically. The checked-in vercel.json specifies the build command (npm run build) and output directory (dist). Root directory stays at the repository root. No environment variables are required. Deploy main when ready; future main pushes redeploy through Vercel Git integration.

## Roadmap

- **S001:** Preserved interactive 2D shapes and live measurements.
- **S002:** 3D solids, gesture modes, dimensional editing, and formula-driven live measurements.
- **S003:** Independently scrollable desktop tools and mathematically valid independent tetrahedron vertex editing.
- **S004:** Actual hinged 3D folding/unfolding for cubes and cuboids, 2D net diagram, live individual face and total area invariants.
- **S005:** Expand nets to tetrahedra, square pyramids and triangular prisms, or develop slicing and Cavalieri experiments (see [S005 brief](docs/NEXT_SESSION_S005.md)).
- **Later:** Constraints, intersections, construction tools, linked algebra, loci, conics, and free-vertex polyhedral geometry.

## Mathematical conventions

The canvas uses 40 screen units per one mathematical unit. Areas are in square units. Polygon area is calculated with the shoelace formula; edge lengths are Euclidean distances; angle calculations use dot products and oriented turns. Self-intersecting polygons are explicitly flagged because simple-polygon formula interpretations then break down. Numerical displays are rounded, while calculations use unrounded values.

## Design principles

Direct manipulation first; instant and accurate mathematical feedback; explanations of *why* quantities change; small testable pure mathematics modules; no forced sign-in, telemetry, or server costs. This app is an exploratory visual teaching tool, not a formal proof checker.
