import { getRuntimeSecret } from "./_runtimeEnv";

const ADMIN_KEY_HEADER = "x-admin-key";

export function requireAdminAccess(request: Request): Response | null {
  const configuredKey = getRuntimeSecret("ADMIN_ACCESS_KEY");
  if (!configuredKey) return null;

  const suppliedKey =
    request.headers.get(ADMIN_KEY_HEADER) ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (suppliedKey === configuredKey) return null;

  return Response.json(
    { error: "Admin access key required." },
    { status: 401 },
  );
}

export function isAdminRequest(request: Request): boolean {
  const configuredKey = getRuntimeSecret("ADMIN_ACCESS_KEY");
  if (!configuredKey) return true;

  const suppliedKey =
    request.headers.get(ADMIN_KEY_HEADER) ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  return suppliedKey === configuredKey;
}
