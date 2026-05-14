CREATE TABLE "partner_locations" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "waze_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_locations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "partner_clicks" ADD COLUMN "partner_location_id" TEXT;

ALTER TABLE "partner_locations" ADD CONSTRAINT "partner_locations_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "partner_clicks" ADD CONSTRAINT "partner_clicks_partner_location_id_fkey" FOREIGN KEY ("partner_location_id") REFERENCES "partner_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
