const fs = require('fs');
const path = require('path');
const YAML = require('yamljs');

exports.processArgs = (name) => {
  const args = process.argv.slice(2);

  const namespace = args[0];
  const env = args[1];

  if (!namespace || !env) {
    console.log('Missing parameters.');
    console.log(
      `Usage: node tooling/${name} [namespace] [env] [extra tool args]`
    );
    console.log(`ie. node tooling/${name} team1 dev`);
    process.exit(1);
  }

  const sourceDirs = {
    secrets: path.resolve(`../../secrets/contents/${namespace}/${env}`),
  };

  return {namespace, env, sourceDirs};
};

/* Helper methods */

const Helpers = exports.Helpers = {};

Helpers.writeFileToSchemas = (outputDir, filename, contents) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.join(outputDir, filename), contents, {
      encoding: 'utf8',
    }, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

Helpers.readFileContentsAsBase64 = (filepath) => {
  let contents = fs.readFileSync(filepath, 'utf8');
  if (contents.substr(contents.length - 1) === `\n`) {
    contents = contents.substr(0, contents.length - 1);
  }
  return new Buffer(contents).toString('base64');
};

Helpers.readEnvAsBase64 = (key) => {
  let contents = process.env[key];
  if (!contents) {
    console.log(`MISSING ENVRIONMENT VARIABLE: ${key}`);
    return '';
  }
  if (contents.substr(contents.length - 1) === `\n`) {
    contents = contents.substr(0, contents.length - 1);
  }
  return new Buffer(contents).toString('base64');
};

Helpers.replacePlaceHolders = (contents, mapping) => {
  Object.keys(mapping).forEach((key) => {
    const value = mapping[key];
    contents = contents.toString()
      .replace(new RegExp(`{${key}}`, 'g'), value);
  });

  return Promise.resolve(contents);
};

Helpers.readFile = (filename) => {
  if (!fs.existsSync(filename)) {
    return Promise.reject(Error(`File ${filename} do not exist`));
  }
  return Promise.resolve(fs.readFileSync(filename));
};


exports.processSecrets = (sourceDirs, secrets) => {
  const processed = {};
  Object.keys(secrets).map((key) => {
    let value;
    const source = secrets[key].split(':');
    if (source[0] === 'file') {
      const sourcePath = path.resolve(`${sourceDirs[source[1]]}/${source[2]}`);
      value = Helpers.readFileContentsAsBase64(sourcePath);
    } else if (source[0] === 'env') {
      value = Helpers.readEnvAsBase64(source[1]);
    }
    processed[key] = value;
  });
  return processed;
};

exports.writeSecrets = (opts, secrets) => {
  console.log(
    `Writing secret ${opts.metadata.name} to ${opts.outputDir}/${opts.filename}`
  );
  const yamlContents = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: opts.metadata,
    type: 'Opaque',
    data: secrets,
  };

  return Helpers.writeFileToSchemas(
    opts.outputDir, opts.filename, YAML.stringify(yamlContents, 8, 2)
  );
};
