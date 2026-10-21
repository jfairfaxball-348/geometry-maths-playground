/** Editable tetrahedra: pure Euclidean maths, independent of Three.js. */
export const TETRA_FACES = [[0,1,2],[0,2,3],[0,3,1],[1,3,2]];
export const TETRA_EDGES = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
const subtract=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const length=a=>Math.hypot(...a);
const number=x=>Number(x.toFixed(2)).toLocaleString('en-GB',{maximumFractionDigits:2});

export function canonicalTetrahedron(side=3) {
  const height=side*Math.sqrt(2/3), radius=side/Math.sqrt(3);
  return [[0,3*height/4,0],...Array.from({length:3},(_,i)=>{
    const angle=Math.PI/2+i*2*Math.PI/3;
    return [radius*Math.cos(angle),-height/4,radius*Math.sin(angle)];
  })];
}
export function signedTetraVolume(vertices) {
  const [a,b,c,d]=vertices;
  return dot(subtract(b,a),cross(subtract(c,a),subtract(d,a)))/6;
}
export function faceArea(vertices,face) {
  const [a,b,c]=face.map(i=>vertices[i]);
  return length(cross(subtract(b,a),subtract(c,a)))/2;
}
export function validTetrahedron(vertices, orientation=1) {
  if(!Array.isArray(vertices)||vertices.length!==4||
    vertices.some(p=>!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v)||Math.abs(v)>12)))return false;
  const signed=signedTetraVolume(vertices);
  if(Math.sign(signed)!==Math.sign(orientation)||Math.abs(signed)<.02)return false;
  if(TETRA_FACES.some(face=>faceArea(vertices,face)<.03))return false;
  return TETRA_EDGES.every(([a,b])=>length(subtract(vertices[a],vertices[b]))>.15);
}
export function withMovedVertex(vertices,index,position) {
  if(!Number.isInteger(index)||index<0||index>3)return null;
  const next=vertices.map(p=>[...p]);
  next[index]=[...position];
  return validTetrahedron(next,Math.sign(signedTetraVolume(vertices)))?next:null;
}
export function measureTetraVertices(vertices,scale=1) {
  if(!Number.isFinite(scale)||scale<=0||!validTetrahedron(vertices,Math.sign(signedTetraVolume(vertices))))
    throw new RangeError('Invalid or degenerate tetrahedron');
  const actual=vertices.map(p=>p.map(x=>x*scale));
  const edges=TETRA_EDGES.map(([a,b])=>length(subtract(actual[a],actual[b])));
  const areas=TETRA_FACES.map(f=>faceArea(actual,f));
  const volume=Math.abs(signedTetraVolume(actual)),surfaceArea=areas.reduce((a,b)=>a+b,0);
  return {
    name:'Editable tetrahedron',type:'tetrahedron',volume,surfaceArea,
    topology:[4,6,4],euler:2,
    classification:'General tetrahedron · four triangular faces · six independently measured edges',
    formula:'V = |det(B−A, C−A, D−A)| / 6   ·   S = Σ ½ |(B−A) × (C−A)|',
    substitution:'V = '+number(volume)+' u³ · S = '+areas.map(number).join(' + ')+' = '+number(surfaceArea)+' u²',
    detail:[
      ...TETRA_EDGES.map(([a,b],i)=>[['A','B','C','D'][a]+['A','B','C','D'][b],number(edges[i])+' u']),
      ['Individual face areas',areas.map(v=>number(v)+' u²').join(' · ')],
      ['Orientation',signedTetraVolume(vertices)<0?'Negative (preserved)':'Positive (preserved)']
    ],
    edgeLengths:edges, faceAreas:areas
  };
}
