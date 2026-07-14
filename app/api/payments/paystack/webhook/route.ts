import { processPaystackWebhook } from "../../../_store";

export const runtime = "edge";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  try {
    return Response.json(await processPaystackWebhook(rawBody, signature));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to process webhook." },
      { status: 400 }
    );
  }
}
