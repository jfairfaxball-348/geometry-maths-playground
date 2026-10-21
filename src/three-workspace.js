import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SOLIDS, initialSolid, limitDimension, measureSolid, transformObservation } from './solids.mjs';
import { TETRA_FACES, canonicalTetrahedron, measureTetraVertices, withMovedVertex } from './tetra-vertices.mjs';

const fmt = n => Number(n.toFixed(2)).toLocaleString('en-GB', { maximumFractionDigits: 2 });
const axis = { x: new THREE.Vector3(1,0,0), y: new THREE.Vector3(0,1,0), z: new THREE.Vector3(0,0,1) };
const html = s => String(s).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function poly(vertices, faces) {
  const points = [];
  for (const face of faces) for(let i=1;i<face.length-1;i++)
    for (const v of [face[0],face[i],face[i+1]]) points.push(...vertices[v]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  g.computeVertexNormals();
  return g;
}
function triangle(a,y) {
  const r=a/Math.sqrt(3);
  return Array.from({length:3},(_,i)=>[r*Math.cos(Math.PI/2+i*2*Math.PI/3),y,r*Math.sin(Math.PI/2+i*2*Math.PI/3)]);
}
function geometryFor(t,p) {
  if(t==='cube')return new THREE.BoxGeometry(p.side,p.side,p.side);
  if(t==='cuboid')return new THREE.BoxGeometry(p.width,p.height,p.depth);
  if(t==='sphere')return new THREE.SphereGeometry(p.radius,48,32);
  if(t==='cylinder')return new THREE.CylinderGeometry(p.radius,p.radius,p.height,56);
  if(t==='cone')return new THREE.ConeGeometry(p.radius,p.height,56);
  if(t==='tetrahedron'){
    const h=p.side*Math.sqrt(2/3);
    return poly([[0,3*h/4,0],...triangle(p.side,-h/4)],[[0,1,2],[0,2,3],[0,3,1],[1,3,2]]);
  }
  if(t==='pyramid'){
    const a=p.side/2,h=p.height/2;
    return poly([[-a,-h,-a],[a,-h,-a],[a,-h,a],[-a,-h,a],[0,h,0]],[[0,3,2,1],[0,1,4],[1,2,4],[2,3,4],[3,0,4]]);
  }
  if(t==='prism'){
    const d=p.depth/2,h=p.side*Math.sqrt(3)/2,a=p.side/2;
    return poly([[-a,-h/3,-d],[a,-h/3,-d],[0,2*h/3,-d],[-a,-h/3,d],[a,-h/3,d],[0,2*h/3,d]],
      [[2,1,0],[3,4,5],[0,1,4,3],[1,2,5,4],[2,0,3,5]]);
  }
}
function handleSpecs(s) {
  const p=s.params;
  switch(s.type){
    case 'cube':return [['width','x',p.side/2,2],['height','y',p.side/2,2],['depth','z',p.side/2,2]];
    case 'cuboid':return [['width','x',p.width/2,2],['height','y',p.height/2,2],['depth','z',p.depth/2,2]];
    case 'sphere':return [['radius','x',p.radius,1]];
    case 'cylinder': case 'cone':return [['radius','x',p.radius,1],['height','y',p.height/2,2]];
    case 'tetrahedron':return [['side','x',p.side/Math.sqrt(3),Math.sqrt(3)]];
    case 'pyramid':return [['side','x',p.side/2,2],['height','y',p.height/2,2]];
    case 'prism':return [['side','x',p.side/2,2],['depth','z',p.depth/2,2]];
  }
}

export function mount3D({canvasHost,toolsHost,mathHost}) {
  canvasHost.innerHTML='<div class="three-canvas-shell"><div class="three-canvas" aria-label="Interactive three-dimensional geometry"></div><div class="three-overlay"><span class="live-dot"></span> LIVE 3D</div><div class="three-axis-key">X <span>●</span> &nbsp; Y <span>●</span> &nbsp; Z <span>●</span></div></div><div class="three-canvas-bottom"><span>Drag to orbit · Scroll or pinch to zoom · Right-drag to pan</span><button id="camera-reset" type="button">↺ Reset camera</button></div>';
  const canvas=canvasHost.querySelector('.three-canvas');
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0xfcfdff,1);
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  canvas.appendChild(renderer.domElement);
  renderer.domElement.style.touchAction='none';
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(45,1,.1,100);
  const orbit=new OrbitControls(camera,renderer.domElement);
  orbit.enableDamping=false;orbit.minDistance=2.2;orbit.maxDistance=30;
  scene.add(new THREE.HemisphereLight(0xffffff,0x9ba8c9,2));
  const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(5,8,6);scene.add(light);
  const fill=new THREE.DirectionalLight(0xa8afff,1.3);fill.position.set(-5,1,-4);scene.add(fill);
  const grid=new THREE.GridHelper(10,20,0xc3ccdf,0xe7eaf3);grid.position.y=-2.3;scene.add(grid);
  const axes=new THREE.AxesHelper(4.7);scene.add(axes);
  const object=new THREE.Group();scene.add(object);
  const s={...initialSolid('cube'),mode:'orbit',view:'solid',active:false,drag:null,vertices:null,selectedVertex:0,vertexPlane:'screen',undoVertices:null,observation:'Resize a cube on one axis to turn it into a cuboid.'};
  const currentMeasurement=()=>s.type==='tetrahedron'&&s.vertices?measureTetraVertices(s.vertices,s.scale):measureSolid(s.type,s.params,s.scale);
  function stopDrag(){
    if(s.drag && renderer.domElement.hasPointerCapture(s.drag.id))renderer.domElement.releasePointerCapture(s.drag.id);
    s.drag=null;
  }
  let solid=null,edges=null,handles=[],frame=0;
  const ray=new THREE.Raycaster(), mouse=new THREE.Vector2(), plane=new THREE.Plane(), intersection=new THREE.Vector3();
  function repaint(){if(!s.active||frame)return;frame=requestAnimationFrame(()=>{frame=0;if(s.active)renderer.render(scene,camera);});}
  function fit(){if(!s.active)return;const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();repaint();}
  function cameraReset(){camera.position.set(6,4.5,7);orbit.target.set(0,0,0);orbit.update();repaint();}
  orbit.addEventListener('change',repaint);
  canvasHost.querySelector('#camera-reset').addEventListener('click',cameraReset);
  cameraReset();

  toolsHost.innerHTML='<div class="side-heading"><span class="eyebrow">01 / 3D SOLIDS</span><h2>Choose a solid</h2><p>Reshape in the canvas or enter exact dimensions.</p></div><div class="shape-options three-shape-options" id="solid-picker"></div>'+
    '<div class="side-section"><span class="eyebrow">02 / INTERACT</span><h3>Choose your gesture</h3><div class="three-modes" role="group" aria-label="Interaction mode"></div><p class="microcopy" id="three-mode-hint"></p></div>'+
    '<div class="side-section" id="vertex-section" hidden><span class="eyebrow">03 / EDIT VERTICES</span><h3>Move an individual corner</h3><p class="vertex-help">Choose a point, then drag its coloured marker. Each corner moves independently; no regular-tetrahedron assumption.</p><label class="three-number-row"><span>Drag plane</span><select id="vertex-plane" aria-label="Vertex dragging plane"><option value="screen">Screen-facing</option><option value="xy">XY · keep Z</option><option value="xz">XZ · keep Y</option><option value="yz">YZ · keep X</option></select></label><label class="three-number-row"><span>Selected point</span><select id="vertex-select" aria-label="Selected vertex"><option value="0">A · vertex 1</option><option value="1">B · vertex 2</option><option value="2">C · vertex 3</option><option value="3">D · vertex 4</option></select></label><div class="three-triple vertex-triple"><label>X<input type="number" data-vertex-coordinate="0" step="0.1"></label><label>Y<input type="number" data-vertex-coordinate="1" step="0.1"></label><label>Z<input type="number" data-vertex-coordinate="2" step="0.1"></label></div><button type="button" class="reflect-button" id="vertex-undo" disabled>↶ Undo point edit</button><p class="vertex-status" id="vertex-status" role="status">A tetrahedron has four genuine movable corners.</p></div>'+
    '<div class="side-section"><span class="eyebrow">04 / DIMENSIONS</span><div id="solid-dimensions"></div><label class="three-number-row"><span>Uniform scale</span><input type="number" id="solid-scale" min="0.2" max="4" step="0.05" value="1"></label></div>'+
    '<div class="side-section"><span class="eyebrow">05 / POSITION & ROTATION</span><div id="solid-transform-inputs"></div><button type="button" class="reflect-button" id="solid-reset">↺ Reset solid</button></div>'+
    '<div class="side-section settings three-settings"><span class="eyebrow">06 / DISPLAY</span><label class="switch-row"><span>Coordinate grid</span><input id="three-grid" type="checkbox" checked><span class="switch"></span></label><label class="three-number-row"><span>Surface</span><select id="three-view"><option value="solid">Solid</option><option value="transparent">Transparent</option><option value="wireframe">Wireframe</option></select></label></div>';
  mathHost.innerHTML='<div class="right-top"><span class="eyebrow">THE MATHEMATICS · 3D</span><div class="live-status"><span class="live-dot"></span> Live</div></div><h2 id="solid-math-title"></h2><p class="right-intro">Measurements come from the parameters used to construct this solid.</p><div class="metric-grid" id="solid-metrics"></div>'+
    '<div class="math-section"><div class="section-rule"><span class="eyebrow">UNDER THE HOOD</span><span class="rule"></span></div><div id="solid-formula"></div></div>'+
    '<div class="math-section"><div class="section-rule"><span class="eyebrow">WHAT CHANGES?</span><span class="rule"></span></div><div class="discovery" id="solid-discovery"></div></div>'+
    '<button type="button" class="copy-button" id="solid-copy">⧉ Copy 3D measurements</button><p class="rounding-note">Lengths: u · area: u² · volume: u³. Calculations use full precision.</p>';

  const picker=toolsHost.querySelector('#solid-picker'), dimensions=toolsHost.querySelector('#solid-dimensions');
  picker.innerHTML=Object.entries(SOLIDS).map(([key,v])=>'<button type="button" class="shape-option" data-solid="'+key+'" aria-pressed="false"><span class="shape-icon">'+v.symbol+'</span><span><strong>'+v.name+'</strong><small>'+v.fields.join(' · ')+'</small></span><span class="chevron">›</span></button>').join('');
  const names={orbit:'Orbit',edit:'Edit points',resize:'Resize',move:'Move',rotate:'Rotate',scale:'Scale'};
  toolsHost.querySelector('.three-modes').innerHTML=Object.entries(names).map(([k,n])=>'<button type="button" data-mode="'+k+'" aria-pressed="false">'+n+'</button>').join('');

  function mode(){
    toolsHost.querySelectorAll('[data-mode]').forEach(b=>{
      const on=b.dataset.mode===s.mode;
      b.disabled=b.dataset.mode==='edit'&&s.type!=='tetrahedron';
      b.title=b.disabled?'Independent points are available on the tetrahedron':b.textContent;
      b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));
    });
    toolsHost.querySelector('#vertex-section').hidden=s.type!=='tetrahedron'||s.mode!=='edit';
    toolsHost.querySelector('#three-mode-hint').textContent=({
      orbit:'Left-drag to orbit, right-drag to pan; scroll or pinch to zoom.',
      edit:'Drag a vertex marker to change the actual tetrahedron; choose XY/XZ/YZ to control depth.',
      resize:'Drag the coloured handles to change dimensions.',
      move:'Drag the solid to translate without changing its volume.',
      rotate:'Drag the solid to change orientation, not its volume.',
      scale:'Drag the solid sideways: area changes quadratically, volume cubically.'
    })[s.mode];
    orbit.enabled=s.mode==='orbit'&&!s.drag;
    canvasHost.querySelector('.three-canvas-bottom > span').textContent=s.mode==='edit'?'Drag a coloured corner · Change the drag plane for depth · Use X/Y/Z for precision':'Drag to orbit · Scroll or pinch to zoom · Right-drag to pan';
    renderer.domElement.style.cursor=s.mode==='orbit'?'grab':'crosshair';
    repaint();
  }
  function dimensionControls(){
    dimensions.innerHTML=SOLIDS[s.type].fields.map(field=>'<label class="three-dimension"><span>'+field+'</span><input type="range" data-dimension="'+field+'" min="0.35" max="8" step="0.05" value="'+s.params[field]+'"><input type="number" data-number-dimension="'+field+'" aria-label="'+field+'" min="0.35" max="8" step="0.05" value="'+s.params[field]+'"></label>').join('');
  }
  function transformControls(){
    toolsHost.querySelector('#solid-transform-inputs').innerHTML=['position','rotation'].map(kind=>{
      return '<p class="three-input-label">'+(kind==='position'?'Translation (units)':'Rotation (degrees)')+'</p><div class="three-triple">'+[0,1,2].map(i=>'<label>'+['X','Y','Z'][i]+'<input type="number" data-'+kind+'="'+i+'" step="'+(kind==='position'?.1:5)+'" value="'+fmt(kind==='position'?s.position[i]:s.rotation[i]*180/Math.PI)+'"></label>').join('')+'</div>';
    }).join('');
  }
  function sync(){
    Object.entries(s.params).forEach(([key,value])=>{
      const slider=toolsHost.querySelector('[data-dimension="'+key+'"]'),num=toolsHost.querySelector('[data-number-dimension="'+key+'"]');
      if(slider)slider.value=value;if(num&&document.activeElement!==num)num.value=fmt(value);
    });
    const scalar=toolsHost.querySelector('#solid-scale');
    if(document.activeElement!==scalar)scalar.value=fmt(s.scale);
    if(s.vertices){
      const selector=toolsHost.querySelector('#vertex-select');
      selector.value=String(s.selectedVertex);
      toolsHost.querySelector('#vertex-undo').disabled=!s.undoVertices;
      toolsHost.querySelectorAll('[data-vertex-coordinate]').forEach(input=>{
        if(document.activeElement!==input)input.value=fmt(s.vertices[s.selectedVertex][+input.dataset.vertexCoordinate]);
      });
    }
    for(const kind of ['position','rotation'])for(let i=0;i<3;i++){
      const input=toolsHost.querySelector('[data-'+kind+'="'+i+'"]');
      if(input&&document.activeElement!==input)input.value=fmt(kind==='position'?s.position[i]:s.rotation[i]*180/Math.PI);
    }
  }
  function cleanupMesh(){
    for(const part of [solid,edges,...handles])if(part){object.remove(part);part.geometry?.dispose();part.material?.dispose();}
    solid=null;edges=null;handles=[];
  }
  function draw(){
    cleanupMesh();
    const g=s.type==='tetrahedron'&&s.vertices?poly(s.vertices,TETRA_FACES):geometryFor(s.type,s.params);
    const material=s.view==='wireframe'?
      new THREE.MeshBasicMaterial({color:0x666bdc,wireframe:true,side:THREE.DoubleSide}):
      new THREE.MeshStandardMaterial({color:0x8d93ee,roughness:.42,metalness:.08,flatShading:!['sphere','cylinder','cone'].includes(s.type),transparent:s.view==='transparent',opacity:s.view==='transparent'?.32:1,depthWrite:s.view!=='transparent',side:THREE.DoubleSide});
    solid=new THREE.Mesh(g,material);object.add(solid);
    if(s.view!=='wireframe'){
      edges=new THREE.LineSegments(new THREE.EdgesGeometry(g,20),new THREE.LineBasicMaterial({color:0x525ac0,transparent:true,opacity:s.view==='transparent'?.7:.55}));
      object.add(edges);
    }
    if(s.mode==='resize')for(const [field,coordinate,length,multiplier] of handleSpecs(s)){
      const dot=new THREE.Mesh(new THREE.SphereGeometry(.115,16,12),new THREE.MeshBasicMaterial({color:coordinate==='x'?0xee786f:coordinate==='y'?0x48af98:0x609cf0,depthTest:false}));
      dot.position.copy(axis[coordinate]).multiplyScalar(length+.11);dot.renderOrder=9;
      dot.userData={field,coordinate,multiplier};handles.push(dot);object.add(dot);
    }
    if(s.mode==='edit'&&s.type==='tetrahedron'&&s.vertices){
      s.vertices.forEach((vertex,index)=>{
        const dot=new THREE.Mesh(new THREE.SphereGeometry(.17,16,12),new THREE.MeshBasicMaterial({
          color:index===s.selectedVertex?0xf9ae4f:0x626ce6,depthTest:false
        }));
        dot.position.fromArray(vertex);dot.userData={vertex:index};dot.renderOrder=10;
        handles.push(dot);object.add(dot);
      });
    }
    object.position.fromArray(s.position);object.rotation.set(...s.rotation);object.scale.setScalar(s.scale);
    repaint();
  }
  function maths(){
    const m=currentMeasurement();
    mathHost.querySelector('#solid-math-title').textContent=m.name;
    const card=(k,v,u,accent)=>'<div class="metric-card'+(accent?' purple':'')+'"><span class="metric-label">'+k+'</span><span class="metric-value">'+v+'<span class="metric-unit">'+u+'</span></span></div>';
    mathHost.querySelector('#solid-metrics').innerHTML=card('Volume',fmt(m.volume),'u³',true)+card('Surface area',fmt(m.surfaceArea),'u²')+
      (m.topology?card('Vertices / edges',m.topology[0]+' / '+m.topology[1],'')+card('Faces',String(m.topology[2]),''):card('Classification','Curved',''));
    const rows=[...m.detail,['Centre position','('+s.position.map(fmt).join(', ')+')']];
    if(m.topology)rows.push(["Euler's formula",m.topology[0]+' − '+m.topology[1]+' + '+m.topology[2]+' = '+m.euler]);
    else rows.push(['Euler rule','Polyhedra only']);
    mathHost.querySelector('#solid-formula').innerHTML='<span class="formula-title">'+html(m.classification)+'</span><div class="formula-box">'+html(m.formula)+'<div class="three-substitution">'+html(m.substitution)+'</div></div><ul class="detail-list">'+rows.map(([k,v])=>'<li><span>'+html(k)+'</span><strong>'+html(v)+'</strong></li>').join('')+'</ul>';
    mathHost.querySelector('#solid-discovery').innerHTML='<span class="discovery-icon">✳</span><div><strong>Notice the change.</strong> '+html(s.observation)+'</div>';
    sync();
  }
  function update(){draw();maths();}
  function change(callback,kind){
    const prior=currentMeasurement();
    callback();
    s.observation=transformObservation(prior,currentMeasurement(),kind);
    update();
  }
  function choose(type){
    stopDrag();
    Object.assign(s,initialSolid(type));
    s.vertices=type==='tetrahedron'?canonicalTetrahedron(s.params.side):null;
    s.selectedVertex=0;s.undoVertices=null;
    if(s.mode==='edit'&&type!=='tetrahedron')s.mode='orbit';
    s.observation=type==='cube'?'Resize just one edge: a cube becomes a cuboid. Doubling every edge multiplies volume by 8.':type==='sphere'?'Doubling radius quadruples area and multiplies volume by 8.':'Change a dimension and compare its effect on volume and surface area.';
    picker.querySelectorAll('button').forEach(b=>{const on=b.dataset.solid===s.type;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    dimensionControls();transformControls();mode();update();
  }
  picker.addEventListener('click',e=>{const b=e.target.closest('[data-solid]');if(b)choose(b.dataset.solid);});
  toolsHost.querySelector('.three-modes').addEventListener('click',e=>{
    const b=e.target.closest('[data-mode]');if(!b||b.disabled)return;
    stopDrag();s.mode=b.dataset.mode;mode();update();
  });
  toolsHost.querySelector('#vertex-plane').addEventListener('change',e=>{s.vertexPlane=e.target.value;});
  toolsHost.querySelector('#vertex-select').addEventListener('change',e=>{s.selectedVertex=+e.target.value;update();});
  toolsHost.querySelector('.vertex-triple').addEventListener('change',e=>{
    const axisIndex=+e.target.dataset.vertexCoordinate;
    if(!Number.isInteger(axisIndex)||axisIndex<0||axisIndex>2||e.target.value.trim()==='')return;
    const position=[...s.vertices[s.selectedVertex]];
    position[axisIndex]=Number(e.target.value);
    const next=withMovedVertex(s.vertices,s.selectedVertex,position);
    if(next){
      s.undoVertices=s.vertices.map(p=>[...p]);s.vertices=next;
      s.observation='Moving one corner changes the six edge lengths, four face areas and determinant volume; the other three corners remain fixed.';
      toolsHost.querySelector('#vertex-status').textContent='Vertex updated. Volume and face areas recomputed from its coordinates.';
    }else toolsHost.querySelector('#vertex-status').textContent='Rejected: the tetrahedron must not collapse or invert, and points must remain within ±12 units.';
    update();
  });
  toolsHost.querySelector('#vertex-undo').addEventListener('click',()=>{
    if(!s.undoVertices)return;
    s.vertices=s.undoVertices;s.undoVertices=null;
    s.observation='Undid the most recent point edit.';update();
  });
  dimensions.addEventListener('input',e=>{
    const key=e.target.dataset.dimension||e.target.dataset.numberDimension;
    if(!key||e.target.value===''||!Number.isFinite(+e.target.value))return;
    change(()=>{
      s.params[key]=limitDimension(e.target.value);
      if(s.type==='tetrahedron'){s.vertices=canonicalTetrahedron(s.params.side);s.undoVertices=null;}
    },'dimension');
  });
  toolsHost.querySelector('#solid-scale').addEventListener('input',e=>{
    const v=+e.target.value;if(!Number.isFinite(v)||v<=0)return;
    change(()=>{s.scale=THREE.MathUtils.clamp(v,.2,4);},'uniform');
  });
  toolsHost.querySelector('#solid-transform-inputs').addEventListener('input',e=>{
    const kind=e.target.hasAttribute('data-position')?'position':e.target.hasAttribute('data-rotation')?'rotation':null;
    if(!kind||e.target.value===''||!Number.isFinite(+e.target.value))return;
    const i=+e.target.dataset[kind],v=+e.target.value;
    change(()=>{s[kind][i]=kind==='rotation'?v*Math.PI/180:v;},kind==='rotation'?'rotate':'move');
  });
  toolsHost.querySelector('#three-view').addEventListener('change',e=>{s.view=e.target.value;draw();});
  toolsHost.querySelector('#three-grid').addEventListener('change',e=>{grid.visible=e.target.checked;axes.visible=e.target.checked;repaint();});
  toolsHost.querySelector('#solid-reset').addEventListener('click',()=>choose(s.type));
  mathHost.querySelector('#solid-copy').addEventListener('click',async()=>{
    const m=currentMeasurement();
    try{await navigator.clipboard.writeText(m.name+'\nVolume '+fmt(m.volume)+' u³\nArea '+fmt(m.surfaceArea)+' u²\n'+m.substitution);mathHost.querySelector('#solid-copy').textContent='Copied measurements';}
    catch{mathHost.querySelector('#solid-copy').textContent='Clipboard unavailable';}
  });

  function pick(e){
    const r=renderer.domElement.getBoundingClientRect();
    mouse.x=2*(e.clientX-r.left)/r.width-1;mouse.y=1-2*(e.clientY-r.top)/r.height;
    ray.setFromCamera(mouse,camera);
  }
  function hitPlane(e){
    pick(e);return ray.ray.intersectPlane(plane,intersection)?intersection.clone():null;
  }
  function down(e){
    if(s.mode==='orbit'||(e.pointerType==='mouse'&&e.button!==0))return;
    pick(e);
    const hit=(s.mode==='resize'||s.mode==='edit'?ray.intersectObjects(handles):ray.intersectObject(solid))[0];
    if(!hit)return;
    e.preventDefault();
    if(s.mode==='edit'){
      s.selectedVertex=hit.object.userData.vertex;
      const normals={xy:axis.z,xz:axis.y,yz:axis.x};
      const normal=normals[s.vertexPlane]
        ?normals[s.vertexPlane].clone().applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()))
        :camera.getWorldDirection(new THREE.Vector3());
      plane.setFromNormalAndCoplanarPoint(normal,hit.object.getWorldPosition(new THREE.Vector3()));
      s.undoVertices=s.vertices.map(p=>[...p]);
      toolsHost.querySelector('#vertex-status').textContent='Dragging vertex '+['A','B','C','D'][s.selectedVertex]+' · '+s.vertexPlane.toUpperCase()+' plane';
      update();
    }else plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),s.mode==='resize'?hit.object.getWorldPosition(new THREE.Vector3()):object.getWorldPosition(new THREE.Vector3()));
    const selected=hit.object.userData;
    s.drag={id:e.pointerId,start:hitPlane(e),x:e.clientX,y:e.clientY,base:{params:{...s.params},position:[...s.position],rotation:[...s.rotation],scale:s.scale,vertices:s.vertices?.map(p=>[...p])},handle:selected,direction:selected.coordinate?axis[selected.coordinate].clone().applyQuaternion(object.quaternion):null};
    renderer.domElement.setPointerCapture(e.pointerId);
  }
  function move(e){
    const d=s.drag;if(!d||d.id!==e.pointerId||!d.start)return;
    const point=hitPlane(e);if(!point)return;
    const delta=point.sub(d.start);
    if(s.mode==='edit'){
      const localDelta=delta.applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()).invert()).divideScalar(s.scale);
      const nextPosition=d.base.vertices[d.handle.vertex].map((value,i)=>value+localDelta.getComponent(i));
      const next=withMovedVertex(d.base.vertices,d.handle.vertex,nextPosition);
      if(!next){
        toolsHost.querySelector('#vertex-status').textContent='Movement limited: avoid collapsed or inverted tetrahedra.';
        return;
      }
      s.vertices=next;
      s.observation='Individual corners move independently. Edge lengths, triangle face areas and determinant volume now come from these four vertices.';
      toolsHost.querySelector('#vertex-status').textContent='Point '+['A','B','C','D'][d.handle.vertex]+' moved · valid tetrahedron.';
      update();return;
    }
    const old=currentMeasurement();
    if(s.mode==='resize'){
      if(s.type==='cube'){
        s.type='cuboid';s.params={width:d.base.params.side,height:d.base.params.side,depth:d.base.params.side};
        picker.querySelectorAll('button').forEach(b=>{const active=b.dataset.solid==='cuboid';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
        dimensionControls();
      }
      const key=d.handle.field;
      s.params[key]=limitDimension((d.base.params.side??d.base.params[key])+delta.dot(d.direction)*d.handle.multiplier/s.scale);
      if(s.type==='tetrahedron'){s.vertices=canonicalTetrahedron(s.params.side);s.undoVertices=null;}
    }
    if(s.mode==='move')s.position=d.base.position.map((value,i)=>value+delta.getComponent(i));
    if(s.mode==='rotate')s.rotation=[d.base.rotation[0]+(e.clientY-d.y)*.008,d.base.rotation[1]+(e.clientX-d.x)*.008,d.base.rotation[2]];
    if(s.mode==='scale')s.scale=THREE.MathUtils.clamp(d.base.scale*Math.exp((e.clientX-d.x)/160),.2,4);
    s.observation=transformObservation(old,currentMeasurement(),s.mode==='resize'?'dimension':s.mode==='scale'?'uniform':s.mode);
    update();
  }
  function up(e){
    if(s.drag?.id!==e.pointerId)return;
    if(e.type==='pointercancel'&&s.mode==='edit'&&s.undoVertices){s.vertices=s.undoVertices;s.undoVertices=null;update();}
    stopDrag();
  }
  renderer.domElement.addEventListener('pointerdown',down);
  renderer.domElement.addEventListener('pointermove',e=>{
    if(!s.drag&&s.mode==='edit'){
      pick(e);
      renderer.domElement.style.cursor=ray.intersectObjects(handles).length?'grab':'crosshair';
    }else if(s.drag&&s.mode==='edit')renderer.domElement.style.cursor='grabbing';
    move(e);
  });
  renderer.domElement.addEventListener('pointerup',up);
  renderer.domElement.addEventListener('pointercancel',up);
  renderer.domElement.addEventListener('lostpointercapture',()=>{s.drag=null;});
  const observer=new ResizeObserver(fit);observer.observe(canvas);
  mode();choose('cube');
  function setActive(value){s.active=value;s.drag=null;if(value)fit();else if(frame){cancelAnimationFrame(frame);frame=0;}}
  function dispose(){stopDrag();setActive(false);observer.disconnect();orbit.dispose();cleanupMesh();axes.geometry.dispose();axes.material.dispose();grid.geometry.dispose();grid.material.dispose();renderer.dispose();}
  window.addEventListener('pagehide',dispose,{once:true});
  return {setActive,dispose};
}
