import test from 'node:test';
import assert from 'node:assert/strict';
import { boxNet, supportsBoxNet, netMatchesSurfaceArea } from '../src/box-nets.mjs';
import { measureSolid } from '../src/solids.mjs';

const near = (x,y) => assert.ok(Math.abs(x-y) < 1e-9, x+' != '+y);
function touches(a,b) {
  const l=a.x-a.width/2,r=a.x+a.width/2,t=a.y+a.height/2,bottom=a.y-a.height/2;
  const L=b.x-b.width/2,R=b.x+b.width/2,T=b.y+b.height/2,B=b.y-b.height/2;
  return Math.max(0,Math.min(r,R)-Math.max(l,L)) * Math.max(0,Math.min(t,T)-Math.max(bottom,B));
}

test('cube unfolds into six equal, connected, nonoverlapping square faces', () => {
  const net=boxNet('cube',{side:3});
  assert.equal(net.faces.length,6);
  assert.equal(new Set(net.faces.map(f=>f.id)).size,6);
  net.faces.forEach(f => { near(f.width,3); near(f.height,3); near(f.area,9); });
  near(net.area,54);
  near(net.area,measureSolid('cube',{side:3}).surfaceArea);
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)near(touches(net.faces[i],net.faces[j]),0);
});

test('rectangular net has correct face pairs and dimensions', () => {
  const net=boxNet('cuboid',{width:5,height:3,depth:2});
  const get=id=>net.faces.find(f=>f.id===id);
  near(get('front').area,15);near(get('back').area,15);
  near(get('top').area,10);near(get('bottom').area,10);
  near(get('left').area,6);near(get('right').area,6);
  near(net.area,62);near(net.algebraicArea,62);
  assert.deepEqual(net.bounds,{minX:-4.5,maxX:4.5,minY:-3.5,maxY:6.5});
  for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)near(touches(net.faces[i],net.faces[j]),0);
});

test('actual net layout shares correct hinges', () => {
  const net=boxNet('cuboid',{width:5,height:3,depth:2});
  const faces=Object.fromEntries(net.faces.map(f=>[f.id,f]));
  const edges=(a)=>({l:a.x-a.width/2,r:a.x+a.width/2,b:a.y-a.height/2,t:a.y+a.height/2});
  near(edges(faces.top).b,edges(faces.front).t);
  near(edges(faces.bottom).t,edges(faces.front).b);
  near(edges(faces.left).r,edges(faces.front).l);
  near(edges(faces.right).l,edges(faces.front).r);
  near(edges(faces.back).b,edges(faces.top).t);
});

test('net face sum matches analytic area for non-unit scaling', () => {
  const p={width:2.5,height:3.4,depth:1.2};
  for(const scale of [0.2,1,1.5,4]){
    const net=boxNet('cuboid',p,scale),solid=measureSolid('cuboid',p,scale);
    assert.ok(netMatchesSurfaceArea(net,solid.surfaceArea));
    near(net.area,2*(p.width*p.height+p.width*p.depth+p.height*p.depth)*scale**2);
  }
});

test('unsupported curved solids and bad dimensions cannot produce false nets', () => {
  assert.equal(supportsBoxNet('cone'),false);
  assert.equal(boxNet('sphere',{radius:2}),null);
  assert.throws(()=>boxNet('cube',{side:-1}),RangeError);
  assert.throws(()=>boxNet('cuboid',{width:1,height:NaN,depth:1}),RangeError);
  assert.throws(()=>boxNet('cube',{side:1},0),RangeError);
});
