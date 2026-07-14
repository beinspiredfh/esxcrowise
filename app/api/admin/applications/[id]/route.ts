import { requireAdminAccess } from "../../../_adminAuth";
import { updateSellerApplication } from "../../../_store";

export const runtime = "edge";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const blocked = requireAdminAccess(request);
  if (blocked) return blocked;

  try {
    const { id } = await context.params;
    return Response.json(await updateSellerApplication(id.toUpperCase(), await request.json()));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update application." },
      { status: 400 }
    );
  }
}
