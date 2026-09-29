// Service Worker para Firebase Cloud Messaging (FCM)
// Rota da Saúde - Notificações Push para Medicamentos e Leituras Críticas

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener nativo para eventos Push do Web Push / FCM
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const notification = data.notification || data;
  const title = notification.title || 'Rota da Saúde • Notificação';
  const body = notification.body || 'Você possui uma nova atualização de saúde.';
  const type = (data.data && data.data.type) || 'GENERAL';

  let icon = '/assets/favicon.ico';
  let badge = '/assets/favicon.ico';
  let tag = 'rota-saude-' + Date.now();

  const options = {
    body: body,
    icon: icon,
    badge: badge,
    tag: tag,
    vibrate: type === 'CRITICAL_READING' ? [300, 100, 300, 100, 300] : [200, 100, 200],
    data: data.data || {},
    requireInteraction: type === 'CRITICAL_READING',
    actions: type === 'MEDICATION'
      ? [
          { action: 'take_med', title: '💊 Tomei Agora' },
          { action: 'snooze', title: '⏰ Lembrar em 15m' }
        ]
      : type === 'CRITICAL_READING'
      ? [
          { action: 'view_patient', title: '🚨 Ver Paciente' },
          { action: 'dismiss', title: 'Entendido' }
        ]
      : []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Clique na Notificação Push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          // Send message to client about clicked action
          client.postMessage({
            type: 'FCM_NOTIFICATION_CLICK',
            action: action,
            data: event.notification.data
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
