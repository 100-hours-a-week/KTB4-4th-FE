// 브라우저 런타임의 Sentry 오류 수집 초기화 설정
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = window.location.hostname === "needu.gift" ? "production" : "development";

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment,
});
