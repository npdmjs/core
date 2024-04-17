import { workerData, parentPort } from 'node:worker_threads';
import tar from 'tar-stream';

import zlib from 'zlib';
import { promisify } from 'util';
import type { PackageContent } from './PackageContent.js';

const gunzip = promisify(zlib.gunzip);


const packageUrl = workerData as string;

type PackageDetails = { dist: { tarball: string } };

(async () => {
  const unzipped = await fetch(packageUrl)
    .then(res => res.json())
    .then((details: PackageDetails) => details.dist.tarball)
    .then(fetch)
    .then(data => data.arrayBuffer())
    // gunzip expects a buffer
    .then(buffer => Buffer.from(buffer))
    .then(gunzip);

  const packageContent: PackageContent = [];

  await new Promise((resolve, reject) => {
    const extract = tar.extract();
    extract.on('entry', (header, stream, next) => {
      const chunks: Buffer[] = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => {
        const content = Buffer.concat(chunks);
        const path = header.name.replace(/^package\//, '');
        packageContent.push({ path, content });
        next();
      });
      stream.resume();
    });

    extract.on('finish', resolve);
    extract.on('error', reject);

    extract.end(unzipped);
  });

  parentPort?.postMessage(packageContent);
})();