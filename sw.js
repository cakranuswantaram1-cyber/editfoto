// sw.js — Editor Foto Pro (update otomatis: internet dulu, cache saat offline)
const CACHE_PREFIX = 'editor-foto-';
// Naikkan angka versi (v2, v3, ...) HANYA bila menambah/mengganti file di urlsToCache.
// Mengedit isi index.html saja TIDAK perlu menaikkan versi, karena index.html selalu diambil dari internet dulu.
const CACHE_NAME = CACHE_PREFIX + 'v1';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
  // Tambahkan gambar lain di sini, mis. './images/logo.png'
  // PERINGATAN: bila satu file di daftar ini tidak ada (404), seluruh instalasi service worker gagal.
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Hapus hanya cache lama milik aplikasi ini; cache aplikasi lain di domain yang sama dibiarkan.
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE_NAME)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Internet dulu supaya pembaruan otomatis terambil; bila offline pakai cache.
// Library CDN (Tailwind, Font Awesome, dll.) ikut tersimpan sehingga aplikasi tetap tampil penuh saat offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
