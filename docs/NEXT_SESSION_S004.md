# Geometry Maths Playground — S004: Animated Folding Nets (completed)

**Repository:** https://github.com/jfairfaxball-348/geometry-maths-playground  
**Application:** https://geometry-maths-playground.vercel.app/

## Owner-directed scope change

The S004 priority was changed from cross-sections to **option 2: animated 3D unfolding and folding of surface nets**. Genuine cutting planes, graphs and Cavalieri experiments were deliberately deferred.

## Delivered

- Cube and cuboid **Unfold net** mode, with five real hinges and six colored face meshes.
- Fold/Unfold buttons, manually scrubbable progress, orbital camera throughout, reduced-motion support.
- A corresponding flat 2D net in the mathematics panel with selectable, highlighted faces and individual live face areas.
- Exact identity `A = 2(wh + wd + hd)`, or `6a²` for cubes, equal to the sum of all six net faces.
- Rebuild nets from dimension and uniform scale changes. Volume is explicitly labelled as the volume **when folded**.
- Separate renderer `src/folding-box.js`, pure maths `src/box-nets.mjs`, and regression tests.
- Cube/cuboid only, rather than misleading approximations for curved or more complicated shapes.

## Verification and next steps

Run `npm run check && npm test && npm run build` locally and visually exercise cube/cuboid folding, switching back and forth to 2D, and the Vercel deployment. If browser interaction testing isn't possible, state that honestly. S005 is tracked in [NEXT_SESSION_S005.md](NEXT_SESSION_S005.md), with priority on additional polyhedral nets followed by cross-sections.
