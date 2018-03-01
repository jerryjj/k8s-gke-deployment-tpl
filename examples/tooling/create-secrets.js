'use strict';

const fs = require('fs');
const path = require('path');
const {
  processArgs, processSecrets, writeSecrets,
} = require('./lib/common');

const scriptName = path.basename(__filename);
const {namespace, env, sourceDirs} = processArgs(scriptName);

const args = process.argv.slice(4);
const secretMappingsPath = args[0];
const outputDir = args[1];

if (!secretMappingsPath || !outputDir) {
  console.log('Missing parameters.');
  console.log(
    `Usage: node tooling/${scriptName} ` +
    `[namespace] [env] [secret-map] [output-directory]`
  );
  console.log(
    `ie. node tooling/${scriptName} ` +
    `team2 dev ./team2/mappings/payments.secrets.json ./team2/schemas/secrets/`
  );
  process.exit(1);
}

let secretMappings = {};

try {
  secretMappings = JSON.parse(fs.readFileSync(secretMappingsPath, 'utf8'));
} catch (err) {
  console.log('Failed to parse secret mappings!');
  console.log(err);
  process.exit(1);
}

const tasks = Object.keys(secretMappings).map((mapKey) => {
  return writeSecrets({
    outputDir: path.resolve(outputDir),
    metadata: {
      name: `${namespace}-${env}-${mapKey}`,
      namespace: namespace,
    },
    filename: `${env}.${namespace}.${mapKey}.secrets.yml`,
  }, processSecrets(sourceDirs, secretMappings[mapKey]));
});

Promise.all(tasks)
.then(() => {
  console.log('Done.');
})
.catch((err) => {
  console.log('Failed', err);
});
