const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 8080);
const model = process.env.XAI_MODEL || 'grok-3-mini';
const root = __dirname;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const newsFeeds = {
  tech: [
    ['CNN', 'https://rss.cnn.com/rss/edition_technology.rss'],
    ['BBC', 'https://feeds.bbci.co.uk/news/technology/rss.xml'],
    ['MIT Technology Review', 'https://www.technologyreview.com/feed/']
  ],
  science: [
    ['CNN', 'https://rss.cnn.com/rss/edition_space.rss'],
    ['NASA', 'https://www.nasa.gov/rss/dyn/breaking_news.rss'],
    ['Nature', 'https://www.nature.com/nature.rss']
  ],
  crypto: [
    ['CoinDesk', 'https://www.coindesk.com/arc/outboundfeeds/rss/'],
    ['Cointelegraph', 'https://cointelegraph.com/rss']
  ],
  world: [
    ['CNN Mundo', 'https://rss.cnn.com/rss/edition_world.rss'],
    ['BBC Mundo', 'https://feeds.bbci.co.uk/mundo/rss.xml'],
    ['DW Español', 'https://rss.dw.com/rdf/rss-es-all']
  ],
  conflicts: [
    ['CNN Mundo', 'https://rss.cnn.com/rss/edition_world.rss'],
    ['Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml']
  ],
  latam: [
    ['CNN Español', 'https://cnnespanol.cnn.com/feed/'],
    ['BBC Mundo', 'https://feeds.bbci.co.uk/mundo/rss.xml']
  ]
};
const newsCache = new Map();
const NEWS_CACHE_TTL = 24 * 60 * 60 * 1000;
const fallbackNews = {
  tech: [['CNN Tecnología', 'https://cnnespanol.cnn.com/tecnologia/'], ['BBC Tecnología', 'https://www.bbc.com/mundo/topics/cyx5krnw38vt']],
  science: [['CNN Ciencia', 'https://cnnespanol.cnn.com/ciencia-y-medio-ambiente/'], ['NASA Noticias', 'https://www.nasa.gov/news/']],
  crypto: [['CoinDesk', 'https://www.coindesk.com/'], ['Cointelegraph', 'https://cointelegraph.com/']],
  world: [['CNN Mundo', 'https://cnnespanol.cnn.com/mundo/'], ['BBC Mundo', 'https://www.bbc.com/mundo']],
  conflicts: [['CNN Mundo', 'https://cnnespanol.cnn.com/mundo/'], ['Al Jazeera', 'https://www.aljazeera.com/']],
  latam: [['CNN Español', 'https://cnnespanol.cnn.com/latinoamerica/'], ['BBC Mundo', 'https://www.bbc.com/mundo']]
};

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch (error) { reject(error); }
    });
    request.on('error', reject);
  });
}

function parseRssItems(xml, source) {
  const blocks = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map((match) => match[0]);
  const atomBlocks = [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)].map((match) => match[0]);
  return [...blocks, ...atomBlocks].slice(0, 8).map((item) => {
    const read = (tag) => item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1] || '';
    const clean = (value) => value.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
    const dateValue = new Date(clean(read('pubDate') || read('dc:date') || read('published')));
    const linkTag = item.match(/<link\b([^>]*)>([\s\S]*?)<\/link>/i)?.[0] || item.match(/<link\b[^>]*\/?>(?![\s\S]*<\/link>)/i)?.[0] || '';
    const link = clean(read('link') || linkTag.match(/href=["']([^"']+)["']/i)?.[1] || '');
    return { title: clean(read('title')), link: /^https?:\/\//i.test(link) ? link : '', source, timestamp: Number.isNaN(dateValue.getTime()) ? 0 : dateValue.getTime(), date: Number.isNaN(dateValue.getTime()) ? '' : dateValue.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) };
  }).filter((item) => item.title && item.link);
}

async function getNews(feedName) {
  const feeds = newsFeeds[feedName] || newsFeeds.world;
  const cached = newsCache.get(feedName);
  if (cached && Date.now() - cached.updatedAt < NEWS_CACHE_TTL) return cached.items;
  const results = await Promise.allSettled(feeds.map(async ([source, url]) => {
    const response = await fetch(url, { headers: { 'User-Agent': 'PulsePlayer/1.0' } });
    if (!response.ok) throw new Error(`Feed returned ${response.status}`);
    return parseRssItems(await response.text(), source);
  }));
  const items = results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
  const uniqueItems = [...new Map(items.map((item) => [item.link, item])).values()]
    .sort((first, second) => second.timestamp - first.timestamp).slice(0, 12);
  if (!uniqueItems.length) {
    const items = (fallbackNews[feedName] || fallbackNews.world).map(([source, link]) => ({ title: `Abrir últimas noticias de ${source}`, link, source, date: 'Fuente web', timestamp: 0 }));
    newsCache.set(feedName, { items, updatedAt: Date.now() });
    return items;
  }
  newsCache.set(feedName, { items: uniqueItems, updatedAt: Date.now() });
  return uniqueItems;
}

async function answerWithGrok(message, context) {
  if (!process.env.XAI_API_KEY) throw new Error('XAI_API_KEY is not configured');
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'Responde en espanol con precision profesional. Contesta solo lo que pregunta el usuario. No inventes datos y separa hechos de incertidumbres.' },
        { role: 'user', content: `Pregunta: ${message}\n\nTitulares disponibles como contexto:\n${(context || []).join('\n')}` }
      ]
    })
  });
  if (!response.ok) throw new Error(`xAI returned ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'La IA no devolvio una respuesta.';
}

function serveFile(request, response) {
  const requestPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const relativePath = requestPath === '/' ? 'index.html' : requestPath.slice(1);
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(root + path.sep)) {
    response.writeHead(403); response.end('Forbidden'); return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === 'GET' && requestUrl.pathname === '/api/news') {
    if (requestUrl.searchParams.get('refresh') === '1') newsCache.delete(requestUrl.searchParams.get('feed'));
    try { sendJson(response, 200, await getNews(requestUrl.searchParams.get('feed'))); }
    catch (error) { sendJson(response, 502, { error: 'News feed unavailable' }); }
    return;
  }
  if (request.method === 'POST' && request.url === '/api/ai') {
    try {
      const body = await readBody(request);
      const answer = await answerWithGrok(String(body.message || '').trim(), body.context);
      sendJson(response, 200, { answer });
    } catch (error) {
      sendJson(response, 500, { error: 'AI service unavailable' });
    }
    return;
  }
  if (request.method === 'GET') { serveFile(request, response); return; }
  response.writeHead(405); response.end('Method not allowed');
});

server.listen(port, () => console.log(`App running at http://localhost:${port}`));
