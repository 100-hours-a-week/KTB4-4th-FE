// 웹 푸시 수신 시 OS 알림 표시와 알림 클릭 시 화면 이동을 처리하는 서비스 워커

const NOTIFICATION_ICON_PATH = "/icon.png";

// 앱 내 알림 드롭다운의 이동 규칙(src/lib/notificationTarget.ts)과 동일하게 유지함
// 이동 대상이 없으면 null을 반환하며, 이 경우 기존 탭을 띄우거나 홈을 엶
function getNotificationTargetPath(payload) {
  if (!payload) return null;

  // 콕 찌르기는 기존 리소스가 아니라 새 AI 대화를 시작하므로 식별자 없이 AI 대화 화면으로 이동함
  if (payload.category === "POKE") return "/ai";

  switch (payload.resourceType) {
    case "USER":
      return payload.resourceId === null ? null : `/friends/${payload.resourceId}`;
    default:
      return null;
  }
}

function parsePushPayload(event) {
  try {
    return event.data.json();
  } catch {
    return null;
  }
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = parsePushPayload(event);

  if (!payload?.title) return;

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const hasVisibleClient = windowClients.some((client) => client.visibilityState === "visible");

      // 앱을 보고 있으면 SSE로 이미 알림이 표시되므로 OS 알림을 띄우지 않음
      if (hasVisibleClient) return;

      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: NOTIFICATION_ICON_PATH,
        badge: NOTIFICATION_ICON_PATH,
        // 같은 알림이 중복 수신되면 OS 알림을 하나로 합침
        tag: `notification-${payload.notificationId}`,
        data: payload,
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = getNotificationTargetPath(event.notification.data);
  const targetUrl = targetPath ? new URL(targetPath, self.location.origin).href : null;

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existingClient = windowClients.find((client) =>
        client.url.startsWith(self.location.origin),
      );

      if (existingClient) {
        await existingClient.focus();

        if (!targetUrl) return;

        try {
          await existingClient.navigate(targetUrl);
          return;
        } catch {
          // 서비스 워커가 제어하지 않는 탭은 navigate가 실패하므로 새 창으로 엶
        }
      }

      await self.clients.openWindow(targetUrl ?? self.location.origin);
    })(),
  );
});
