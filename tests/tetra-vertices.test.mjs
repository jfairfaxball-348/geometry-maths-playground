import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TETRA_EDGES, canonicalTetrahedron, signedTetraVolume,
  faceArea, validTetrahedron, withMovedVertex, measureTetraVertices
} from '../src/tetra-vertices.mjs';

const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,actual+' differs from '+expected);

test('canonical tetrahedron agrees with regular closed forms',()=>{
  const vertices=canonicalTetrahedron(3),m=measureTetraVertices(vertices);
  assert.equal(m.topology.join(','),'4,6,4');
  near(m.volume,27/(6*Math.sqrt(2)));
  near(m.surfaceArea,9*Math.sqrt(3));
  for(const length of m.edgeLengths)near(length,3);
});
test('one corner changes independently, and all measurements derive from moved corners',()=>{
  const before=canonicalTetrahedron(3);
  const after=withMovedVertex(before,0,[before[0][0]+.4,before[0][1]+.6,before[0][2]]);
  assert.ok(after);
  for(let i=1;i<4;i++)assert.deepEqual(after[i],before[i]);
  const initial=measureTetraVertices(before),changed=measureTetraVertices(after);
  assert.ok(Math.abs(changed.volume-initial.volume)>.1);
  assert.ok(Math.abs(changed.surfaceArea-initial.surfaceArea)>.01);
  // Edges opposite the edited apex remain unchanged.
  for(let i=3;i<TETRA_EDGES.length;i++)near(changed.edgeLengths[i],initial.edgeLengths[i]);
  near(changed.volume,Math.abs(signedTetraVolume(after)));
  near(changed.surfaceArea,changed.faceAreas.reduce((sum,n)=>sum+n,0));
});
test('right tetrahedron has exact determinant volume and triangle face areas',()=>{
  const points=[[0,0,0],[1,0,0],[0,1,0],[0,0,1]];
  near(signedTetraVolume(points),1/6);
  near(measureTetraVertices(points).surfaceArea,1.5+Math.sqrt(3)/2);
  near(faceArea(points,[0,1,2]),.5);
});
test('collapsed, inverted and out-of-bounds vertex drags are rejected',()=>{
  const points=[[0,0,0],[1,0,0],[0,1,0],[0,0,1]];
  assert.equal(withMovedVertex(points,3,[.2,.2,0]),null);
  assert.equal(withMovedVertex(points,3,[0,0,-1]),null);
  assert.equal(withMovedVertex(points,3,[0,0,25]),null);
  assert.equal(withMovedVertex(points,7,[1,2,3]),null);
  assert.equal(validTetrahedron(points),true);
});
test('rigid translation preserves measurements and scaling obeys powers 2 and 3',()=>{
  const points=canonicalTetrahedron(2.7),m=measureTetraVertices(points);
  const translated=points.map(v=>v.map((x,i)=>x+[2,-3,.5][i]));
  near(measureTetraVertices(translated).volume,m.volume);
  near(measureTetraVertices(translated).surfaceArea,m.surfaceArea);
  const double=measureTetraVertices(points,2);
  near(double.volume,8*m.volume);
  near(double.surfaceArea,4*m.surfaceArea);
});
