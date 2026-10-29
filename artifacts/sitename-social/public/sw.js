// Ravetill service worker: makes the site installable as an app and shows phone notifications (push). It does not keep (cache) any page or data,
// so a new deploy is always shown at once and nothing old can stay on a phone.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { /* every request goes to the network as usual */ });

// A notification arrives from the server (supabase function "push-send").
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data ? event.data.text() : "" }; }
  event.waitUntil(self.registration.showNotification(data.title || "Ravetill", {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.tag || undefined,
    data: { url: data.url || "/" },
  }));
});

// Tapping the notification opens (or brings back) the app on the right page.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if ("focus" in client) return client.focus().then(() => { try { return client.navigate(url); } catch (e) { return undefined; } });
    }
    return self.clients.openWindow(url);
  }));
});
