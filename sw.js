/**
 * GABObras • service worker (aplicativo instalável e modo offline básico)
 * Coloque este arquivo na MESMA pasta do GABObras.html no site (ex.: GitHub Pages).
 *
 * - A página abre mesmo sem internet (última versão guardada).
 * - Bibliotecas (gráficos, mapa, ícones e fontes) ficam guardadas após o 1º acesso.
 * - As chamadas ao Apps Script NUNCA passam pelo cache: os dados vêm sempre da planilha
 *   (sem internet, o sistema usa a cópia que ele mesmo guarda no navegador).
 */
const VERSAO = 'gabobras-v2.1.0';
const CACHE_PAGINA = VERSAO + '-pagina';
const CACHE_LIBS = VERSAO + '-libs';
const LIBS = /^(https:\/\/(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\/)/;
const MAPA = /^https:\/\/[abc]?\.?tile\.openstreetmap\.org\//;

self.addEventListener('install', () => self.skipWaiting());

// A página informa o próprio endereço (GABObras.html, index.html...) para ficar guardada
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.tipo === 'guardar' && typeof d.url === 'string' && d.url.startsWith(self.registration.scope)) {
    e.waitUntil(caches.open(CACHE_PAGINA).then(c => c.add(new Request(d.url, { cache: 'reload' }))).catch(() => {}));
  }
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter(n => n.startsWith('gabobras-') && !n.startsWith(VERSAO)).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  // Apps Script e Google (login, dados): sempre direto na rede
  if (/script\.google\.com|script\.googleusercontent\.com|accounts\.google\.com/.test(url)) return;

  // Páginas: rede primeiro (sempre a versão mais nova); sem internet, a última guardada
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        if (r && r.ok) { const c = await caches.open(CACHE_PAGINA); c.put(new URL(req.url).origin + new URL(req.url).pathname, r.clone()); }
        return r;
      } catch (err) {
        const c = await caches.open(CACHE_PAGINA);
        const u = new URL(req.url);
        const qualquer = async () => { const k = await c.keys(); return k.length ? c.match(k[0]) : null; };
        return (await c.match(u.origin + u.pathname)) || (await qualquer()) ||
          new Response('<h1 style="font-family:sans-serif">GABObras</h1><p style="font-family:sans-serif">Sem conexão. Abra o sistema uma vez com internet para usá-lo offline.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // Bibliotecas e fontes: cache primeiro, atualizando em segundo plano
  if (LIBS.test(url)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE_LIBS);
      const guardado = await c.match(req);
      const rede = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
      return guardado || (await rede) || Response.error();
    })());
    return;
  }

  // Mapa (OpenStreetMap): rede primeiro, com até 400 pedaços guardados para uso offline
  if (MAPA.test(url)) {
    e.respondWith((async () => {
      const c = await caches.open(CACHE_LIBS + '-mapa');
      try {
        const r = await fetch(req);
        if (r && (r.ok || r.type === 'opaque')) {
          c.put(req, r.clone());
          c.keys().then(k => { if (k.length > 400) k.slice(0, k.length - 400).forEach(x => c.delete(x)); });
        }
        return r;
      } catch (err) { return (await c.match(req)) || Response.error(); }
    })());
  }
});
