import ErrorPage from "@/components/common/ErrorPage";

import packageInfo from "../../../package.json";

export default function ErrorRoute() {
  return (
    <ErrorPage
      title="잠시 연결이 원활하지 않아요."
      description="네트워크 상태를 확인한 뒤 다시 시도해 주세요."
      feedbackDetails={{
        statusCode: 503,
        errorType: "연결 끊김",
        screenCode: "NU-11",
        appVersion: packageInfo.version,
      }}
    />
  );
}
