import test from 'node:test';
import assert from 'node:assert/strict';
import { SOLIDS, initialSolid, measureSolid, transformObservation } from '../src/solids.mjs';
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, a + ' != ' + b);
test('correct volumes and areas for all eight solids', () => {
  const checks = [
    ['cube',{side:2},8,24],
    ['cuboid',{width:2,height:3,depth:4},24,52],
    ['sphere',{radius:3},36*Math.PI,36*Math.PI],
    ['cylinder',{radius:2,height:6},24*Math.PI,32*Math.PI],
    ['cone',{radius:2,height:3},4*Math.PI,Math.PI*(4+2*Math.sqrt(13))],
    ['tetrahedron',{side:2},8/(6*Math.SQRT2),4*Math.sqrt(3)],
    ['pyramid',{side:3,height:4},12,9+6*Math.sqrt(18.25)],
    ['prism',{side:4,depth:3},12*Math.sqrt(3),8*Math.sqrt(3)+36]
  ];
  for (const [type, params, volume, area] of checks) {
    const m=measureSolid(type,params);
    near(m.volume,volume);near(m.surfaceArea,area);
    assert.ok(m.substitution.includes('u³') && m.substitution.includes('u²'));
  }
});
test('Euler formula for closed convex polyhedra only', () => {
  for(const type of ['cube','cuboid','tetrahedron','pyramid','prism'])
    assert.equal(measureSolid(type,SOLIDS[type].params).euler,2);
  for(const type of ['sphere','cylinder','cone'])
    assert.equal(measureSolid(type,SOLIDS[type].params).euler,null);
});
test('uniform scaling changes volume cubically and surface area quadratically', () => {
  for(const [type,definition] of Object.entries(SOLIDS)){
    const a=measureSolid(type,definition.params),b=measureSolid(type,definition.params,2);
    near(b.volume,8*a.volume);near(b.surfaceArea,4*a.surfaceArea);
  }
});
test('rigid translations and rotations preserve measures',()=>{
  const initial=initialSolid('cuboid');
  const before=measureSolid(initial.type,initial.params,initial.scale);
  initial.position=[3,-2,4];initial.rotation=[1,2,3];
  const after=measureSolid(initial.type,initial.params,initial.scale);
  near(before.volume,after.volume);near(before.surfaceArea,after.surfaceArea);
  assert.match(transformObservation(before,after,'rotate'),/unchanged/);
});
test('radius and height changes are reflected in analytical measures',()=>{
  const a=measureSolid('sphere',{radius:1}),b=measureSolid('sphere',{radius:2});
  near(b.volume,8*a.volume);near(b.surfaceArea,4*a.surfaceArea);
  const c=measureSolid('cylinder',{radius:2,height:3}),d=measureSolid('cylinder',{radius:2,height:6});
  near(d.volume,2*c.volume);
  const e=measureSolid('cone',{radius:2,height:3}),f=measureSolid('cone',{radius:2,height:6});
  near(f.volume,2*e.volume);
});
test('invalid dimensions rejected; selecting a new solid resets state',()=>{
  assert.throws(()=>measureSolid('sphere',{radius:0}),RangeError);
  assert.throws(()=>measureSolid('cube',{side:2},-1),RangeError);
  const s=initialSolid('cube');s.params.side=9;
  assert.notEqual(initialSolid('cube').params.side,9);
});
