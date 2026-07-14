import { openDispute } from "../_store";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      escrowId: string;
      reason: string;
      evidenceNote?: string;
    };

    return Response.json(
      await openDispute(payload.escrowId, payload.reason, payload.evidenceNote || ""),
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to open dispute." },
      { status: 400 }
    );
  }
}
