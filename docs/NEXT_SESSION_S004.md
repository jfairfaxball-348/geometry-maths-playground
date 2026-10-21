# Geometry Maths Playground — S004: True Cross-Sections, Nets and Further Editable Solids

**Repository:** https://github.com/jfairfaxball-348/geometry-maths-playground  
**Live application:** https://geometry-maths-playground.vercel.app/

## Goal

Implement real, explorable cross-sections and unfolded nets, then expand independent vertex editing beyond the tetrahedron where mathematical validity can be maintained. This is a **code session**: inspect the current code, implement useful functionality, test it, and commit it. Avoid unnecessary session paperwork.

## Starting point — preserve S001–S003

- The original SVG 2D editor remains intact and swaps cleanly with 3D.
- All eight 3D solids, analytic dimensions, transform modes, camera orbit/pan/zoom and live maths remain.
- The desktop left tools panel now scrolls independently; smaller viewports scroll naturally.
- Tetrahedron **Edit points** has independent corner handles, selectable screen-facing/XY/XZ/YZ drag planes, numerical local coordinates, undo, degenerate/inversion guards and actual-face determinant maths.
- Keep those behaviours. Do not revert to constrained handles or regular-tetrahedron formulas after deformation.

## 1. Browser verification first

Check the deployed and local 2D and 3D editor in a real desktop browser and mobile viewport. In particular, independently scroll the left 3D menu, drag each tetrahedron vertex, change drag planes, enter XYZ values, undo, switch modes, and change solids. Fix any defects found. Run `npm run check`, `npm test` and `npm run build`. If browser tooling is unavailable, state this instead of claiming visual validation.

## 2. Interactive cutting plane — primary feature

Add a visible translucent infinite cutting plane positioned by a signed-distance slider and rotatable about at least two axes. Offer exact numeric offset/orientation fields, reset, and a toggle to view the sliced solid with an optional flattened 2D section inset.

For cube, cuboid, tetrahedron, square pyramid and triangular prism:

- Compute genuine intersections of *the displayed closed polyhedron's actual edges* with the plane, including deformed tetrahedron vertices. Deduplicate within numerical tolerance, sort by angle in the section plane and compute perimeter and area from the resulting planar polygon.
- Explicitly handle zero-section, tangent point/edge, coincident plane/face and regular polygonal sections. Show numerical area, perimeter, corner count and edge lengths when meaningful.
- Keep the original solid's full volume and surface area separate from the cross-section maths.
- Implement independently testable geometry outside the renderer. Do not silently replace a freely deformed tetrahedron with its canonical geometry.

For sphere, cylinder and cone, support **horizontal** analytical sections first and calculate the correct radius and area. Label other orientations as unsupported until proved/implemented correctly. No decorative fake intersections.

## 3. A(z) graph and volume experiments

Show a small live plot of section area versus signed height with the currently selected slice marked.

- Sphere: A(z) = π(R²−z²) within its valid interval.
- Cylinder/prism: constant parallel section area.
- Cone/pyramid: quadratic area growth with height from the apex.
- Explain equal-height, equal-section-area cases via Cavalieri's principle; only claim the property when the actual profiles match.
- If numerical integration is shown, report the method, sample count and approximation error; don't mislabel it an exact proof.

## 4. Surface nets

Support genuine unfolding/flat nets of a cube, cuboid and square pyramid, maintaining matching face dimensions and face-area sums. Label individual faces and provide fold/unfold controls or a clean 2D overlay. Unsupported objects must not show fictitious polygonal nets.

## 5. Extend independent vertex editing with strict geometry

Once slicing is reliable, attempt square-pyramid and triangular-prism vertex moves under mathematically explicit constraints. Shared vertices and planar faces must remain valid. If deforming a face would make the named polygon nonplanar, either reject the move or triangulate into a correctly classified mesh with face- and determinant-derived surface/volume measurements. Never display the old regular-solid formula for a deformed object.

Preserve camera controls, mobile pointers, reset/undo and numeric local-coordinate readouts. Continue constraining spheres, cones and cylinders by their defining parameters.

## 6. Verification

Add focused tests for: square/rectangular/hexagonal cube sections, tetrahedron cuts after vertex movement, tangent and coincident planes, empty sections, sphere equator/poles, cylinder and prism constant sections, cone quadratic scaling, net face area sums, transformations, scale laws and planar degeneracy. Verify 2D ↔ 3D swapping and left-panel scroll behaviour wherever an actual browser is available.

## Delivery

Make working commits to `main` and confirm `npm run check`, `npm test`, and `npm run build` where they have actually been run. Inspect Vercel production deployment after commits and distinguish `committed` from `deployed`. Summarise what is complete, any unsupported sections, and precise outstanding obligations. Produce a complete S005 prompt reflecting remaining functionality rather than creating session bureaucracy.

**Principle:** the rendered geometry, manipulation mechanics and mathematical claims must agree with one another.
