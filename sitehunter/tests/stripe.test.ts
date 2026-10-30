import { it, expect } from "vitest";
import { createHmac } from "crypto";
import { verifyStripeSignature } from "@/lib/stripe";
const sign = (raw: string, t: number, s: string) => `t=${t},v1=${createHmac("sha256", s).update(`${t}.${raw}`).digest("hex")}`;
it("aceita assinatura válida e rejeita adulterada ou antiga", () => {
  const now = Date.now(), t = Math.floor(now / 1000), raw = '{"a":1}';
  expect(verifyStripeSignature(raw, sign(raw, t, "s"), "s", now)).toBe(true);
  expect(verifyStripeSignature(raw + " ", sign(raw, t, "s"), "s", now)).toBe(false);
  expect(verifyStripeSignature(raw, sign(raw, t - 1000, "s"), "s", now)).toBe(false);
  expect(verifyStripeSignature(raw, null, "s", now)).toBe(false);
});
