import { verifyPaystackPayment } from "../../../_store";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference");

  if (!reference) {
    return Response.json({ error: "Missing payment reference." }, { status: 400 });
  }

  try {
    return Response.json(await verifyPaystackPayment(reference));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to verify payment." },
      { status: 400 }
    );
  }
}
