import { NextResponse } from "next/server";

import { generateCaptcha } from "@/lib/captcha";

export async function GET() {
  return NextResponse.json(generateCaptcha());
}
