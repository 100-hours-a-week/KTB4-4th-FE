// Health Check API의 공통 JSON 응답 생성 유틸리티
import { NextResponse } from "next/server";

const HEALTH_CHECK_RESPONSE = {
  status: "UP",
} as const;

export function createHealthCheckResponse() {
  return NextResponse.json(HEALTH_CHECK_RESPONSE, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
