import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

const sw = self;
sw.addEventListener('install', () => { sw.skipWaiting(); });
sw.addEventListener('activate', (e) => { e.waitUntil(sw.clients.claim()); });
sw.addEventListener('push', (e) => {
  const d = e.data?.json() ?? {};
  e.waitUntil(sw.registration.showNotification(d.title, { body: d.body, icon: d.icon ?? '/icons/icon-192.png', badge: '/icons/badge-72.png', data: { url: d.data?.url ?? '/' } }));
});
sw.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(sw.clients.openWindow(e.notification.data?.url ?? '/'));
});
sw.addEventListener('fetch', (e) => {
  if (new URL(e.request.url).pathname.startsWith('/api/v1/teams')) {
    e.respondWith(networkFirst(e.request));
  }
});
async function networkFirst(r) {
  try {
    const resp = await fetch(r);
    (await caches.open('cup-budd')).put(r, resp.clone());
    return resp;
  } catch {
    return (await caches.match(r)) ?? new Response('Offline', { status: 503 });
  }
}
