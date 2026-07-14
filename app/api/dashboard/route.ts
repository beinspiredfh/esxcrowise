import { requireAdminAccess } from "../_adminAuth";
import { getDashboard } from "../_store";

export const runtime = "edge";

export async function GET(request: Request) {
  const blocked = requireAdminAccess(request);
  if (blocked) return blocked;

  try {
    return Response.json(await getDashboard());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load dashboard." },
      { status: 500 }
    );
  }
}
