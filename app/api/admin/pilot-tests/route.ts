import { requireAdminAccess } from "../../_adminAuth";
import { createPilotTestLinks } from "../../_store";

export const runtime = "edge";

export async function POST(request: Request) {
  const blocked = requireAdminAccess(request);
  if (blocked) return blocked;

  try {
    return Response.json(await createPilotTestLinks());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create pilot test links." },
      { status: 400 }
    );
  }
}
