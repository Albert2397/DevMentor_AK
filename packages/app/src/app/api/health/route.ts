import { connection } from "next/server";

import { getRequestScope } from "@/server/container";

export async function GET(): Promise<Response> {
  await connection();
  const report = await getRequestScope().resolve("healthService").check();
  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
