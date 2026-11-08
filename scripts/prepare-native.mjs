import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const rootPath = path.resolve(fileURLToPath(root));
const outputPath = path.resolve(fileURLToPath(output));
if (path.dirname(outputPath) !== rootPath || path.basename(outputPath) !== 'dist') throw new Error('Destino de compilación no válido.');
await rm(outputPath, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of ['index.html', 'src', 'assets']) {
    await cp(new URL(entry, root), new URL(entry, output), { recursive: true });
}
console.log('Cherry: frontend preparado en dist/');
