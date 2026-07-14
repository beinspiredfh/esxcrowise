import { isAdminRequest } from "../../_adminAuth";
import { getEscrow, updateEscrowStatus, type EscrowStatus } from "../../_store";

export const runtime = "edge";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    return Response.json(await getEscrow(id.toUpperCase()));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load escrow." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as {
      status: EscrowStatus;
      actor?: string;
      note?: string;
    };
    const publicBuyerStatuses = new Set<EscrowStatus>(["delivered", "disputed"]);

    if (!isAdminRequest(request) && !publicBuyerStatuses.has(payload.status)) {
      return Response.json(
        { error: "Admin access key required for this status change." },
        { status: 401 },
      );
    }

    return Response.json(
      await updateEscrowStatus(
        id.toUpperCase(),
        payload.status,
        payload.actor || "system",
        payload.note || `Status changed to ${payload.status}.`
      )
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update escrow." },
      { status: 400 }
    );
  }
}
