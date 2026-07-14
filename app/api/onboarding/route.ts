import { requireAdminAccess } from "../_adminAuth";
import { createSellerApplication, getDashboard } from "../_store";

export const runtime = "edge";

export async function GET(request: Request) {
  const blocked = requireAdminAccess(request);
  if (blocked) return blocked;

  try {
    const dashboard = await getDashboard();
    return Response.json({ applications: dashboard.applications || [] });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load applications." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    return Response.json(await createSellerApplication(await request.json()), { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to submit application." },
      { status: 400 }
    );
  }
}
