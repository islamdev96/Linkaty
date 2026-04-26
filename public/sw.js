const CACHE_NAME = 'linkaty-v2.0.0';
const RUNTIME_CACHE = 'runtime-cache-v2';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/clean-design.css',
  '/css/drag-drop.css',
  '/js/simple-app.js',
  '/images/star-factory-icon.jpg',
  // All icons in the icons folder
  '/images/icons/default-icon.svg',
  '/images/icons/petrotrade-icon.svg',
  '/images/icons/notebooklm-icon.svg',
  '/images/icons/google-translate.png',
  '/images/icons/whatsapp.png',
  '/images/icons/google-docs.png',
  '/images/icons/deepseek-numbers.png',
  '/images/icons/google-drive.png',
  '/images/icons/claude.png',
  '/images/icons/chatgpt.png',
  '/images/icons/z-ai.png',
  '/images/icons/perplexity.png',
  '/images/icons/deepseek.png',
  '/images/icons/kimi.png',
  '/images/icons/google-ai-studio.png',
  '/images/icons/gemini.png',
  '/images/icons/copilot.png',
  '/images/icons/genspark.png',
  '/images/icons/manus.png',
  '/images/icons/youtube.png',
  '/images/icons/facebook.png',
  '/images/icons/google.png',
  '/images/icons/github.png',
  '/images/icons/notion.png',
  '/images/icons/router.png',
  '/images/icons/rocketreach.png',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.ico')) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    return new Response('Offline - No cached version available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});
