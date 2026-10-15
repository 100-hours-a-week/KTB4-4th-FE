// 앱 진입 시 웹 푸시 수신용 서비스 워커를 한 번 등록하는 컴포넌트
"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/sw.js";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: "/" }).catch((error) => {
      console.error("서비스 워커 등록에 실패했습니다.", error);
    });
  }, []);

  return null;
}
