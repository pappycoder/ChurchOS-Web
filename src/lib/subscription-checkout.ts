/** The API additionally limits Flutterwave's development host to test keys. */
export function subscriptionCheckoutUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      ["checkout.flutterwave.com", "ravemodal.flutterwave.com", "checkout-v2.dev-flutterwave.com"].includes(url.hostname)
      ? url : null;
  } catch {
    return null;
  }
}
