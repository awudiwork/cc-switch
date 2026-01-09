import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('Starting Vite...');
console.log('Working directory:', process.cwd());

const vite = spawn('node', [path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js')], {
  stdio: 'inherit',
  shell: true
});

vite.on('error', (err) => {
  console.error('Failed to start Vite:', err);
});

vite.on('exit', (code) => {
  console.log('Vite exited with code:', code);
});
