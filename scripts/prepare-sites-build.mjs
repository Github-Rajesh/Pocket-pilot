import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

mkdirSync(join(dist, 'server'), { recursive: true });
mkdirSync(join(dist, '.openai'), { recursive: true });
copyFileSync(join(root, '.openai', 'hosting.json'), join(dist, '.openai', 'hosting.json'));

const html = inlineBuildAssets(readFileSync(join(dist, 'index.html'), 'utf8'));

writeFileSync(
  join(dist, 'server', 'index.js'),
  `const html = ${JSON.stringify(html)};\n\nfunction shouldServeApp(request) {\n  const url = new URL(request.url);\n  const accept = request.headers.get('accept') || '';\n  return request.method === 'GET' && (accept.includes('text/html') || !url.pathname.includes('.'));\n}\n\nexport default {\n  async fetch(request) {\n    if (shouldServeApp(request)) {\n      return new Response(html, {\n        headers: {\n          'content-type': 'text/html; charset=utf-8',\n          'cache-control': 'no-store',\n        },\n      });\n    }\n\n    return new Response('Not found', { status: 404 });\n  },\n};\n`,
);

function inlineBuildAssets(html) {
  return html
    .replace(
      /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
      (_, assetPath) => `<style>${readAsset(assetPath)}</style>`,
    )
    .replace(
      /<script type="module" crossorigin src="([^"]+)"><\/script>/g,
      (_, assetPath) => `<script type="module">${readAsset(assetPath).replaceAll('</script>', '<\\/script>')}</script>`,
    );
}

function readAsset(assetPath) {
  return readFileSync(join(dist, assetPath.replace(/^\//, '')), 'utf8');
}
