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

## Run locally

Requires Node.js 20 or later. There are no third-party runtime or build dependencies.

    npm run dev

Visit http://localhost:5173.

Quality checks:

    npm run check
    npm test
    npm run build

## Deploy to Vercel

Import the GitHub repository jfairfaxball-348/geometry-maths-playground into Vercel. Choose **Other** as the framework preset if not selected automatically. The checked-in vercel.json specifies the build command (npm run build) and output directory (dist). Root directory stays at the repository root. No environment variables are required. Deploy main when ready; future main pushes redeploy through Vercel Git integration.

## Roadmap

- **S001:** Interactive shape editor and trustworthy live measurements.
- **S002:** Construction tools (points, segments, constraints, intersections), undo/redo, named workspaces.
- **S003:** Triangle investigations (centroids, incentres, circumcentres, medians, perpendicular bisectors).
- **S004:** Circle investigations (chords, tangents, angles, cyclic quadrilaterals).
- **S005:** Linked algebra/geometry views, transformations, proofs and export/import of examples.
- **Later:** 3D solids, loci, conics, tessellations and other mathematical structures.

## Mathematical conventions

The canvas uses 40 screen units per one mathematical unit. Areas are in square units. Polygon area is calculated with the shoelace formula; edge lengths are Euclidean distances; angle calculations use dot products and oriented turns. Self-intersecting polygons are explicitly flagged because simple-polygon formula interpretations then break down. Numerical displays are rounded, while calculations use unrounded values.

## Design principles

Direct manipulation first; instant and accurate mathematical feedback; explanations of *why* quantities change; small testable pure mathematics modules; no forced sign-in, telemetry, or server costs. This app is an exploratory visual teaching tool, not a formal proof checker.
