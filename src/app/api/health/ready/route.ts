// Kubernetes와 ALB가 Next.js 서버의 요청 수신 준비 상태를 확인하는 Readiness API
import { createHealthCheckResponse } from "@/lib/healthCheck";

export const dynamic = "force-dynamic";

export function GET() {
  return createHealthCheckResponse();
}
