import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dist = join(root, 'dist');

mkdirSync(join(dist, 'server'), { recursive: true });
mkdirSync(join(dist, '.openai'), { recursive: true });
copyFileSync(join(root, '.openai', 'hosting.json'), join(dist, '.openai', 'hosting.json'));

writeFileSync(
  join(dist, 'server', 'index.js'),
  `const assetBindingNames = ['ASSETS', 'SITE_ASSETS', '__STATIC_CONTENT'];\n\nfunction htmlRequest(request) {\n  const accept = request.headers.get('accept') || '';\n  return request.method === 'GET' && accept.includes('text/html');\n}\n\nasync function fetchAsset(request, env) {\n  for (const bindingName of assetBindingNames) {\n    const binding = env?.[bindingName];\n    if (binding?.fetch) {\n      const response = await binding.fetch(request);\n      if (response.status !== 404) {\n        return response;\n      }\n    }\n  }\n  return null;\n}\n\nexport default {\n  async fetch(request, env) {\n    const response = await fetchAsset(request, env);\n    if (response) {\n      return response;\n    }\n\n    if (htmlRequest(request)) {\n      const url = new URL(request.url);\n      url.pathname = '/index.html';\n      const fallback = await fetchAsset(new Request(url, request), env);\n      if (fallback) {\n        return fallback;\n      }\n    }\n\n    return new Response('Not found', { status: 404 });\n  },\n};\n`,
);
