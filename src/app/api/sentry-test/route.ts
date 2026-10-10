export async function GET() {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  throw new Error("Sentry development verification");
}
export const POST = GET;
