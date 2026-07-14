import { requireAdminAccess } from "../../_adminAuth";
import { getPlatformSettings, updatePlatformSettings } from "../../_store";

export const runtime = "edge";

export async function GET(request: Request) {
  const blocked = requireAdminAccess(request);
  if (blocked) return blocked;

  try {
    return Response.json(await getPlatformSettings());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const blocked = requireAdminAccess(request);
  if (blocked) return blocked;

  try {
    return Response.json(await updatePlatformSettings(await request.json()));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update settings." },
      { status: 400 }
    );
  }
}
