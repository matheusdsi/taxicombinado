-- CreateTable
CREATE TABLE "ride_requests" (
    "id" TEXT NOT NULL,
    "passenger_name" TEXT NOT NULL,
    "passenger_phone" TEXT NOT NULL,
    "origin_address" TEXT NOT NULL,
    "destination_address" TEXT NOT NULL,
    "scheduled_date" TEXT NOT NULL,
    "scheduled_time" TEXT NOT NULL,
    "passenger_count" INTEGER NOT NULL DEFAULT 1,
    "needs_large_vehicle" BOOLEAN NOT NULL DEFAULT false,
    "needs_accessibility" BOOLEAN NOT NULL DEFAULT false,
    "has_luggage" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "estimated_price_min" DOUBLE PRECISION,
    "estimated_price_max" DOUBLE PRECISION,
    "estimated_distance_km" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);
