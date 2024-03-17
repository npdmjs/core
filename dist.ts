import fs from 'node:fs';

fs.writeFileSync('./dist/cjs/package.json', '{ "type": "commonjs" }');
fs.writeFileSync('./dist/mjs/package.json', '{ "type": "module" }');
fs.copyFileSync('.npmignore', './dist/.npmignore');
fs.copyFileSync('LICENSE', './dist/LICENSE');

const packageJson = {
  ...JSON.parse(fs.readFileSync('package.json', 'utf-8')),
  main: 'cjs/index.js',
  module: 'mjs/index.js',
  types: 'cjs/index.d.ts',
  exports: {
    '.': {
      import: './mjs/index.js',
      require: './cjs/index.js',
    },
  },
};

delete packageJson.devDependencies;
delete packageJson.scripts;

fs.writeFileSync('./dist/package.json', JSON.stringify(packageJson, null, 2), 'utf-8');