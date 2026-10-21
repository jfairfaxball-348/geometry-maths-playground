import * as THREE from 'three';
import { boxNet } from './box-nets.mjs';

/**
 * Hinge-accurate box net. All faces are real planar meshes.
 * At progress 0 six faces enclose an exact rectangular prism.
 * At progress 1 they are a single flat, nonoverlapping cross net.
 *
 * The back face is attached to the top face, so it uses a second
 * hinge that rotates in the coordinate system of the first hinge.
 */
export function createFoldingBox(type, params, progress = 0, selected = 'front') {
  const model = boxNet(type,params);
  if (!model) return null;
  const {width:w,height:h,depth:d}=model.dimensions;
  const group=new THREE.Group();
  // Align the front (root) face with the original solid's +Z side.
  group.position.z=d/2;
  const faces=new Map();
  function addFace(parent, id, width, height, x, y) {
    const node=new THREE.Group();
    node.position.set(x,y,0);
    const definition=model.faces.find(f=>f.id===id);
    const material=new THREE.MeshStandardMaterial({
      color:definition.color,side:THREE.DoubleSide,roughness:.65,metalness:0
    });
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);
    mesh.userData.netFace=id;
    node.add(mesh);
    const outline=new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-width/2,-height/2,.008),
        new THREE.Vector3(width/2,-height/2,.008),
        new THREE.Vector3(width/2,height/2,.008),
        new THREE.Vector3(-width/2,height/2,.008)
      ]),
      new THREE.LineBasicMaterial({color:0x26345f,transparent:true,opacity:.7})
    );
    node.add(outline);
    parent.add(node);
    faces.set(id,mesh);
    return node;
  }
  addFace(group,'front',w,h,0,0);
  const right=new THREE.Group();right.position.x=w/2;group.add(right);
  addFace(right,'right',d,h,d/2,0);
  const left=new THREE.Group();left.position.x=-w/2;group.add(left);
  addFace(left,'left',d,h,-d/2,0);
  const top=new THREE.Group();top.position.y=h/2;group.add(top);
  addFace(top,'top',w,d,0,d/2);
  const bottom=new THREE.Group();bottom.position.y=-h/2;group.add(bottom);
  addFace(bottom,'bottom',w,d,0,-d/2);
  const back=new THREE.Group();back.position.y=d;top.add(back);
  addFace(back,'back',w,h,0,h/2);

  function setProgress(value) {
    const t=Math.max(0,Math.min(1,value));
    const angle=(1-t)*Math.PI/2;
    right.rotation.y=angle;left.rotation.y=-angle;
    top.rotation.x=-angle;bottom.rotation.x=angle;
    back.rotation.x=-angle;
  }
  function setHighlight(id) {
    for(const [name,mesh] of faces) {
      mesh.material.emissive.set(name===id?0x222248:0x000000);
      mesh.material.emissiveIntensity=name===id?.43:0;
    }
  }
  function dispose() {
    group.traverse(node=>{
      if(node.geometry)node.geometry.dispose();
      if(node.material){
        const materials=Array.isArray(node.material)?node.material:[node.material];
        for(const material of materials)material.dispose();
      }
    });
  }
  setProgress(progress);
  setHighlight(selected);
  return {group,model,setProgress,setHighlight,dispose};
}
