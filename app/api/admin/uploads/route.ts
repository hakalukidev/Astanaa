import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin-auth";
import { UploadValidationError, saveImageUpload } from "@/lib/local-uploads";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "No file provided." }, { status: 400 });
    }

    return NextResponse.json(await saveImageUpload(file, "astanaa"));
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Admin upload error:", error);
    return NextResponse.json({ message: "Upload failed." }, { status: 500 });
  }
}
