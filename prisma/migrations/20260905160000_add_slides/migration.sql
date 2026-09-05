-- CreateTable
CREATE TABLE "slides" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "image_public_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tag" TEXT NOT NULL DEFAULT 'Featured',
    "cta" TEXT NOT NULL DEFAULT 'VIEW PRODUCTS',
    "cta_href" TEXT NOT NULL DEFAULT '/products',
    "bg" TEXT NOT NULL DEFAULT 'bg-slate-100',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slides_pkey" PRIMARY KEY ("id")
);

