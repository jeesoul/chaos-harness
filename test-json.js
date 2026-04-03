const fs = require('fs');
const path = require('path');

const home = process.env.USERPROFILE;
const cacheDir = path.join(home, '.claude', 'plugins', 'cache', 'chaos-harness', 'chaos-harness', '1.0.0');
const ts = new Date().toISOString();

let installed = {version: 2, plugins: {}};
installed.plugins['chaos-harness@chaos-harness'] = [{
  scope: 'user',
  installPath: cacheDir,
  version: '1.0.0',
  installedAt: ts,
  lastUpdated: ts
}];

fs.writeFileSync('test-output.json', JSON.stringify(installed, null, 2));

console.log('=== cacheDir (raw string) ===');
console.log(cacheDir);
console.log('');
console.log('=== JSON file content ===');
console.log(fs.readFileSync('test-output.json', 'utf8'));
