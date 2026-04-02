import * as crypto from "crypto";

export function validateStripeSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(body, "utf8");
    const computedSignature = `sha256=${hmac.digest("hex")}`;
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature),
    );
  } catch {
    return false;
  }
}
