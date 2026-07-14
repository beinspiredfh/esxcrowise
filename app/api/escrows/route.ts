import { requireAdminAccess } from "../_adminAuth";
import { createEscrow, getDashboard } from "../_store";

export const runtime = "edge";

export async function GET(request: Request) {
  const blocked = requireAdminAccess(request);
  if (blocked) return blocked;

  try {
    return Response.json(await getDashboard());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load escrows." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const blocked = requireAdminAccess(request);
  if (blocked) return blocked;

  try {
    const payload = await request.json();
    return Response.json(await createEscrow(payload), { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create escrow." },
      { status: 400 }
    );
  }
}
