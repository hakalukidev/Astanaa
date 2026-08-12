import { NextResponse } from "next/server";

import { generateCaptcha } from "@/lib/captcha";

// Must stay dynamic: a fresh, unpredictable captcha is required on every
// request. Without this, Next.js statically prerenders the route at build
// time (baking in one captcha forever) and the build fails outright since
// OTP_SIGNING_SECRET isn't available in the build environment.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(generateCaptcha());
}
