'use strict';

const path = require('path');
const {
  Helpers, processArgs,
} = require('./lib/common');

const scriptName = path.basename(__filename);
const {
  namespace, env,
} = processArgs(scriptName);

const args = process.argv.slice(4);
const schemaTplPath = args[0];
const outputDir = args[1];
const restOfArgs = process.argv.slice(6);

if (!schemaTplPath || !outputDir) {
  console.log('Missing parameters.');
  console.log(
    `Usage: node tooling/${scriptName} ` +
    `[namespace] [env] [schema-template-path] [output-directory] ` +
    `[KEY=VALUE ...]`
  );
  console.log(
    `ie. node tooling/${scriptName} ` +
    `team1 dev ./team1/mappings/api.deployment.yml ./team/schemas/ VERSION=dev`
  );
  process.exit(1);
}

const mapping = {
  'NAMESPACE': namespace,
  'ENVIRONMENT': env,
  'PROJECT_ID': process.env.PROJECT_ID,
};

if (restOfArgs && restOfArgs.length) {
  restOfArgs.forEach((arg) => {
    const parts = arg.split('=');
    if (parts.length != 2) {
      return;
    }
    mapping[parts[0]] = parts[1];
  });
}

Object.keys(mapping).forEach((key) => {
  if (!mapping[key]) {
    console.log(`Missing Mapping value for key ${key}`);
  }
});

const outputName = path.basename(schemaTplPath);

Promise.all([
  Helpers.readFile(path.resolve(schemaTplPath))
  .then((contents) => Helpers.replacePlaceHolders(contents, mapping))
  .then((contents) => {
    return Helpers.writeFileToSchemas(outputDir, outputName, contents);
  })
  .catch((err) => {
    console.log('failed to write schema', err);
  }),
])
.then(() => {
  console.log('Done.');
})
.catch((err) => {
  console.log('Failed', err);
});
