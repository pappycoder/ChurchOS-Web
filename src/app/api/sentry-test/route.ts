
export async function GET() {
  throw new Error("Sentry test error from /api/sentry-test (production verification)");
}

export async function POST() {
  throw new Error("Sentry test error from /api/sentry-test POST");
}
