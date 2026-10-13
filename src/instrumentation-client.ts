// 브라우저 런타임의 Sentry 오류 수집 초기화 설정
import * as Sentry from "@sentry/nextjs";

const SENTRY_ENVIRONMENT_BY_HOSTNAME: Record<string, string> = {
  "dev.needu.gift": "development",
  "v2.needu.gift": "staging",
  "prod.needu.gift": "production",
  "needu.gift": "production",
};

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = SENTRY_ENVIRONMENT_BY_HOSTNAME[window.location.hostname] ?? "development";

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment,
});
