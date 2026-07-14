import { requireAdminAccess } from "../../../_adminAuth";
import { adminEscrowAction } from "../../../_store";

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
      action: "hold" | "release" | "refund" | "mark_delivery_pending" | "clear_hold";
      note?: string;
    };

    return Response.json(
      await adminEscrowAction(id.toUpperCase(), payload.action, payload.note || "")
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update escrow." },
      { status: 400 }
    );
  }
}
