import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { UploadValidationError, deleteImageUpload } from "@/lib/local-uploads";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { publicId?: string }
    | null;
  const publicId = payload?.publicId?.trim();

  if (!publicId) {
    return NextResponse.json(
      { message: "An image public id is required." },
      { status: 400 }
    );
  }

  try {
    const result = await deleteImageUpload(publicId);

    return NextResponse.json({
      success: true,
      deleted: result === "ok",
      result,
    });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Image delete error:", error);
    return NextResponse.json({ message: "Image deletion failed." }, { status: 500 });
  }
}
