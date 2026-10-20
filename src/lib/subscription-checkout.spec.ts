import { describe, expect, it } from "vitest";
import { subscriptionCheckoutUrl } from "./subscription-checkout";
describe("subscription checkout redirects", () => {
  it.each(["checkout.flutterwave.com", "ravemodal.flutterwave.com", "checkout-v2.dev-flutterwave.com"])("accepts exact Flutterwave host %s", host => {
    expect(subscriptionCheckoutUrl(`https://${host}/v3/hosted/pay/test`)?.hostname).toBe(host);
  });
  it.each(["https://checkout.paystack.com/pay", "https://checkout-v2.dev-flutterwave.com.evil.example/pay", "https://u@checkout.flutterwave.com/pay", "http://checkout.flutterwave.com/pay", "not-a-url"])("rejects %s", value => {
    expect(subscriptionCheckoutUrl(value)).toBeNull();
  });
});
