import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import fs from 'fs';

const root = dirname(fileURLToPath(import.meta.url));

/**
 * Website layout: landing page at /, the app at /app/.
 * (The default build keeps the app at index.html for Capacitor/Android.)
 */
function websiteLayout() {
  return {
    name: 'furo-website-layout',
    closeBundle() {
      const out = resolve(root, 'dist-web');
      // Move the app page to /app/ and promote the landing page to /
      const appHtml = resolve(out, 'index.html');
      const siteHtml = resolve(out, 'site.html');
      if (fs.existsSync(siteHtml)) {
        fs.mkdirSync(resolve(out, 'app'), { recursive: true });
        fs.renameSync(appHtml, resolve(out, 'app', 'index.html'));
        fs.renameSync(siteHtml, appHtml);
      }
      const manifest = resolve(out, 'manifest.webmanifest');
      if (fs.existsSync(manifest)) {
        const m = JSON.parse(fs.readFileSync(manifest, 'utf8'));
        m.start_url = '/app/';
        m.scope = '/';
        m.icons = m.icons.map(i => ({ ...i, src: '/' + i.src.replace(/^\.?\//, '') }));
        fs.writeFileSync(manifest, JSON.stringify(m, null, 2));
      }
      const apk = resolve(root, 'Furo.apk');
      if (fs.existsSync(apk)) {
        fs.mkdirSync(resolve(out, 'download'), { recursive: true });
        fs.copyFileSync(apk, resolve(out, 'download', 'Furo.apk'));
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const web = mode === 'web';
  return {
    base: web ? '/' : './',
    server: { port: 5173, host: true },
    build: web
      ? {
          outDir: 'dist-web',
          emptyOutDir: true,
          rollupOptions: {
            input: { app: resolve(root, 'index.html'), site: resolve(root, 'site.html') }
          }
        }
      : { outDir: 'dist' },
    plugins: web ? [websiteLayout()] : []
  };
});
