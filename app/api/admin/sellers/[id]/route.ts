import { requireAdminAccess } from "../../../_adminAuth";
import { updateSellerVerification } from "../../../_store";

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
      verificationStatus?: string;
      bankVerificationStatus?: string;
      trustScore?: number;
      verificationNotes?: string;
      adminNotes?: string;
    };

    return Response.json(await updateSellerVerification(id.toUpperCase(), payload));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update seller." },
      { status: 400 }
    );
  }
}
