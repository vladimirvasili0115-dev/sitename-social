// Ravetill service worker: only makes the site installable as an app. It does not keep (cache) any page or data,
// so a new deploy is always shown at once and nothing old can stay on a phone.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { /* every request goes to the network as usual */ });
