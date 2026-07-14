import { requireAdminAccess } from "../../../_adminAuth";
import { sendWhatsAppMessage } from "../../../_store";

export const runtime = "edge";

export async function POST(request: Request) {
  const blocked = requireAdminAccess(request);
  if (blocked) return blocked;

  try {
    const payload = (await request.json()) as {
      escrowId?: string;
      templateId?: string;
      recipientPhone: string;
      body?: string;
    };

    return Response.json(await sendWhatsAppMessage(payload));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to send WhatsApp message." },
      { status: 400 }
    );
  }
}
