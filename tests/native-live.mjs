import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { NativeBridge, validateSnapshot } from '../src/services/nativeBridge.js';
const target = process.argv[2];
const child = spawn('cargo', ['run', '--manifest-path', 'src-tauri/cherry-core/Cargo.toml', '--bin', 'cherry-probe', '-j', '1',
    ...(target ? ['--target-dir', target] : [])], { stdio: ['ignore', 'pipe', 'inherit'] });
let output = '';
child.stdout.setEncoding('utf8').on('data', data => { output += data; });
await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`Native probe exited ${code}`)));
});
const document = JSON.parse(output);
const snapshot = validateSnapshot(document.snapshot);
await new NativeBridge(async () => document.capabilities).discover();
if (process.platform === 'win32') {
    assert.equal(snapshot.provider, 'windows');
    assert.ok(snapshot.telemetry.cpu.value !== null);
    assert.ok(snapshot.telemetry.memoryTotalBytes > 0);
    assert.ok(snapshot.telemetry.ram.value !== null);
}
console.log(JSON.stringify({ provider: snapshot.provider, telemetry: snapshot.telemetry,
    controls: snapshot.controls, mediaAvailable: snapshot.media.available }, null, 2));
