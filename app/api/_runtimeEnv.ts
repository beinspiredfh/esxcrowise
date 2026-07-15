type RuntimeEnv = Record<string, unknown>;

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

export function getRuntimeEnv(): RuntimeEnv {
  const globalEnv = (globalThis as unknown as { env?: RuntimeEnv }).env;
  if (globalEnv) return globalEnv;
  return typeof process !== "undefined" && process.env ? process.env : {};
}

export function getRuntimeSecret(name: string) {
  const value = getRuntimeEnv()[name];
  return typeof value === "string" && value.length > 0 ? value : "";
}

export function getD1Binding() {
  return getRuntimeEnv().DB as D1Database | undefined;
}
