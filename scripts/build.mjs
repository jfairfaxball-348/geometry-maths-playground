import { mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

rmSync('dist', { recursive: true, force: true });
mkdirSync(join('dist', 'src'), { recursive: true });
copyFileSync('index.html', join('dist', 'index.html'));
for (const file of ['app.js', 'geometry.mjs', 'styles.css', 'workspace-switch.js', 'three-workspace.js', 'solids.mjs', 'tetra-vertices.mjs', 'three.css']) {
  copyFileSync(join('src', file), join('dist', 'src', file));
}
console.log('Static geometry playground prepared in dist/');
