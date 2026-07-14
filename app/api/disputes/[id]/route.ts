import { requireAdminAccess } from "../../_adminAuth";
import { resolveDispute, updateDisputeAdmin } from "../../_store";

export const runtime = "edge";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const blocked = requireAdminAccess(request);
  if (blocked) return blocked;

  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      resolution?: string;
      priority?: string;
      assignedTo?: string;
      adminNote?: string;
    };

    if (payload.resolution) {
      return Response.json(
        await resolveDispute(id.toUpperCase(), payload.resolution, payload.adminNote || "")
      );
    }

    return Response.json(await updateDisputeAdmin(id.toUpperCase(), payload));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to resolve dispute." },
      { status: 400 }
    );
  }
}
