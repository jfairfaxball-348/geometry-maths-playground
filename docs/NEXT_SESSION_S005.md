# Geometry Maths Playground — S005: Broader Folding Nets and Direct Exploration

**Repository:** https://github.com/jfairfaxball-348/geometry-maths-playground  
**Live app:** https://geometry-maths-playground.vercel.app/

## Objective

Extend the successful S004 **fold/unfold net lab** beyond cubes and cuboids. This is a coding session: inspect existing implementation, build, test and deploy useful features. No separate session bureaucracy.

## Highest priorities

1. Verify the actual S004 cube/cuboid folding and face selection in a real browser, including viewport resize, touch and mouse orbit, numeric dimension inputs and round-trip 2D ↔ 3D switching. Fix anything found. Keep the pinned local Three.js assets.
2. Add a **regular tetrahedron** net: four congruent equilateral triangles hinged on three edges, with actual rigid rotation into/out of the closed tetrahedron. Preserve accurate areas and shared edges.
3. Add the **square pyramid** (square plus four isosceles triangles) and the **equilateral triangular prism** (three rectangles plus two triangles), with valid hinges and no self-overlap in the flat net. Use explicit face geometry and analytically correct angles.
4. Support selecting different valid net layouts where meaningful, allowing the learner to investigate why multiple planar nets can fold into the same 3D solid.
5. Keep the 2D net diagram in sync with 3D, labels and surface-area arithmetic, numerical changes, zoom/orbit, fold progress and reduced-motion preferences.

## Mathematical requirements

Use closed, watertight polyhedra at fully folded progress and a connected non-overlapping planar net at fully unfolded progress. Require invariant side lengths/areas and equality with the whole solid's surface area at every stage. Reject invalid or nonplanar user-deformed solids rather than claiming a regular net applies. Curved shapes must not be shown as exact planar nets.

## Testing and delivery

Add pure tests for edge coincidence, face orientation, nonoverlap, surface-area conservation, scaling and malformed inputs. Run syntax, maths tests and production build; inspect Vercel, and distinguish deployed status from manually browser-tested status. Keep the app intuitive and preserve 2D editing, tetrahedron vertex editing and independently scrolling controls.

**After polyhedral nets:** genuine cutting planes, their polygonal intersections and graphing A(z) remain a compelling next mathematical laboratory.
