import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";

type CloudinaryDeleteConfig = {
  apiKey: string;
  apiSecret: string;
  cloudName: string;
};

function getCloudinaryDeleteConfig(): CloudinaryDeleteConfig | null {
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const cloudName =
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ??
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();

  if (!apiKey || !apiSecret || !cloudName) {
    return null;
  }

  return {
    apiKey,
    apiSecret,
    cloudName,
  };
}

function createCloudinarySignature(
  params: Record<string, string>,
  apiSecret: string
) {
  const signatureBase = Object.entries(params)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");
}

export async function POST(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { publicId?: string }
    | null;
  const publicId = payload?.publicId?.trim();

  if (!publicId) {
    return NextResponse.json(
      { message: "A Cloudinary public id is required." },
      { status: 400 }
    );
  }

  const config = getCloudinaryDeleteConfig();

  if (!config) {
    return NextResponse.json(
      {
        message:
          "Cloudinary delete credentials are missing. Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      },
      { status: 503 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createCloudinarySignature(
    {
      invalidate: "true",
      public_id: publicId,
      timestamp,
    },
    config.apiSecret
  );

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        api_key: config.apiKey,
        invalidate: "true",
        public_id: publicId,
        signature,
        timestamp,
      }).toString(),
      cache: "no-store",
    }
  );

  const result = (await response.json().catch(() => null)) as
    | { result?: string; error?: { message?: string } }
    | null;

  if (!response.ok) {
    return NextResponse.json(
      {
        message: result?.error?.message ?? "Cloudinary image deletion failed.",
      },
      { status: response.status }
    );
  }

  if (result?.result !== "ok" && result?.result !== "not found") {
    return NextResponse.json(
      { message: "Unexpected Cloudinary delete response." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    deleted: result.result === "ok",
    result: result.result,
  });
}
