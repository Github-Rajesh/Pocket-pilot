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
  `const html = ${JSON.stringify(html)};\n\nfunction shouldServeApp(request) {\n  const url = new URL(request.url);\n  const accept = request.headers.get('accept') || '';\n  return request.method === 'GET' && (accept.includes('text/html') || !url.pathname.includes('.'));\n}\n\nexport default {\n  async fetch(request, env) {\n    const url = new URL(request.url);\n\n    if (request.method === 'POST' && url.pathname === '/api/assistant') {\n      return answerAssistant(request, env);\n    }\n\n    if (shouldServeApp(request)) {\n      return new Response(html, {\n        headers: {\n          'content-type': 'text/html; charset=utf-8',\n          'cache-control': 'no-store',\n        },\n      });\n    }\n\n    return new Response('Not found', { status: 404 });\n  },\n};\n\nasync function answerAssistant(request, env) {\n  if (!env.OPENAI_API_KEY) {\n    return json({ error: 'OPENAI_API_KEY is not configured' }, 501);\n  }\n\n  const body = await request.json();\n  const response = await fetch('https://api.openai.com/v1/responses', {\n    method: 'POST',\n    headers: {\n      'authorization': 'Bearer ' + env.OPENAI_API_KEY,\n      'content-type': 'application/json',\n    },\n    body: JSON.stringify({\n      model: env.OPENAI_MODEL || 'gpt-5-mini',\n      instructions: 'You are Pocket Pilot, a concise personal finance assistant. Use only the supplied finance JSON. Be direct, practical, and avoid pretending to know bank data that is not provided. Do not provide regulated financial advice; explain tradeoffs and suggest conservative next actions.',\n      input: [\n        {\n          role: 'user',\n          content: [\n            {\n              type: 'input_text',\n              text: JSON.stringify({ question: body.question, finance: body.finance }),\n            },\n          ],\n        },\n      ],\n    }),\n  });\n\n  const payload = await response.json();\n\n  if (!response.ok) {\n    return json({ error: payload.error?.message || 'AI request failed' }, response.status);\n  }\n\n  return json({ answer: extractOutputText(payload) });\n}\n\nfunction extractOutputText(payload) {\n  if (payload.output_text) {\n    return payload.output_text;\n  }\n\n  return (payload.output || [])\n    .flatMap((item) => item.content || [])\n    .map((content) => content.text || '')\n    .filter(Boolean)\n    .join('\\n') || 'I could not generate an answer.';\n}\n\nfunction json(data, status = 200) {\n  return new Response(JSON.stringify(data), {\n    status,\n    headers: { 'content-type': 'application/json; charset=utf-8' },\n  });\n}\n`,
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
