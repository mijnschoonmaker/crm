/* Mansard service worker: alleen voor pushmeldingen (geen caching, de app werkt verder precies als zonder). */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { titel: "Mansard", tekst: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titel || "Mansard", {
    body: d.tekst || "", tag: d.tag || "mansard", renotify: true, icon: "/mansard-192.png", badge: "/mansard-192.png",
    data: { url: d.url || "/" }, vibrate: [90, 70, 90]
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(lijst => {
    for (const c of lijst) { if (new URL(c.url).origin === self.location.origin && "focus" in c) { c.postMessage({ type: "mansard-open", url }); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
