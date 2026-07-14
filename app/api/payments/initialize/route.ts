import { initializePayment } from "../../_store";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      escrowId: string;
      buyerEmail?: string;
    };
    const origin = new URL(request.url).origin;

    return Response.json(
      await initializePayment(
        payload.escrowId,
        payload.buyerEmail || "buyer@esxcrowise.com",
        origin
      )
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to initialize payment." },
      { status: 400 }
    );
  }
}
