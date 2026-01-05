import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

const rootDir = path.resolve(__dirname);
const exampleDir = path.resolve(rootDir, '..', '..', 'example');

export default defineConfig({
  root: rootDir,
  base: './',
  build: {
    outDir: path.join(rootDir, 'dist'),
    emptyOutDir: true
  },
  server: {
    fs: {
      allow: [
        rootDir,
        path.resolve(rootDir, '..', '..')
      ]
    }
  },
  preview: {
    fs: {
      allow: [
        rootDir,
        path.resolve(rootDir, '..', '..')
      ]
    }
  },
  plugins: [
    {
      name: 'serve-root-example',
      configureServer(server) {
        server.middlewares.use('/example', createStaticHandler(exampleDir));
      },
      configurePreviewServer(server) {
        server.middlewares.use('/example', createStaticHandler(exampleDir));
      }
    }
  ]
});

function createStaticHandler(baseDir) {
  return (req, res, next) => {
    if (!req.url) return next();
    const cleanPath = decodeURIComponent(req.url.split('?')[0]);
    const filePath = path.join(baseDir, cleanPath);
    if (!filePath.startsWith(baseDir)) return next();
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.setHeader('Content-Type', getMime(filePath));
      fs.createReadStream(filePath).pipe(res);
      return;
    }
    next();
  };
}

function getMime(filePath) {
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  return 'text/plain';
}
