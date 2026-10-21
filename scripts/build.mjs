import { mkdirSync, copyFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, relative, dirname, sep } from 'node:path';

const output='dist';
rmSync(output,{recursive:true,force:true});
mkdirSync(join(output,'src'),{recursive:true});
copyFileSync('index.html',join(output,'index.html'));
for(const file of ['app.js','geometry.mjs','styles.css','workspace-switch.js','three-workspace.js','solids.mjs','tetra-vertices.mjs','three.css'])
  copyFileSync(join('src',file),join(output,'src',file));

// Bundle the minimal transitive Three.js module graph as local static files.
// No browser CDN request is required. Import paths stay identical to npm's source.
// The source graph is resolved during build, so new relative imports in Three.js
// can't silently create 404s after deployment.
const packageRoot=resolve('node_modules/three');
const vendorRoot=resolve(output,'vendor/three');
const visited=new Set();
function copyModule(source) {
  const absolute=resolve(source);
  if(absolute!==packageRoot && !absolute.startsWith(packageRoot+sep))
    throw new Error('Unexpected Three.js import outside installed package: '+absolute);
  if(visited.has(absolute))return;
  if(!existsSync(absolute))throw new Error('Missing Three.js module '+absolute+' (run npm install)');
  visited.add(absolute);
  const rel=relative(packageRoot,absolute),destination=join(vendorRoot,rel);
  mkdirSync(dirname(destination),{recursive:true});
  copyFileSync(absolute,destination);
  const code=readFileSync(absolute,'utf8');
  const pattern=/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]((?:\.\/|\.\.\/)[^'"]+)['"]/g;
  for(const match of code.matchAll(pattern)){
    const specifier=match[1];
    if(!specifier.endsWith('.js'))throw new Error('Unsupported Three.js relative import: '+specifier);
    copyModule(resolve(dirname(absolute),specifier));
  }
}
copyModule(join(packageRoot,'build/three.module.js'));
copyModule(join(packageRoot,'examples/jsm/controls/OrbitControls.js'));
console.log('Static geometry playground built in dist/ with '+visited.size+' locally hosted Three.js modules');
