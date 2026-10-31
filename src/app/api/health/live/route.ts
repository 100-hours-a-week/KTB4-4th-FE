// Kubernetes가 Next.js 프로세스의 응답 가능 여부를 확인하는 Liveness API
import { createHealthCheckResponse } from "@/lib/healthCheck";

export const dynamic = "force-dynamic";

export function GET() {
  return createHealthCheckResponse();
}
