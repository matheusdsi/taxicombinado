-- CreateTable: driver_public_profiles
CREATE TABLE "driver_public_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "photo_url" TEXT,
    "city" TEXT,
    "whatsapp" TEXT,
    "car" TEXT,
    "cat_airport" BOOLEAN NOT NULL DEFAULT false,
    "cat_exec" BOOLEAN NOT NULL DEFAULT false,
    "cat_luxo" BOOLEAN NOT NULL DEFAULT false,
    "cat_pet" BOOLEAN NOT NULL DEFAULT false,
    "cat_7seats" BOOLEAN NOT NULL DEFAULT false,
    "cat_travel" BOOLEAN NOT NULL DEFAULT false,
    "bio" VARCHAR(280),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "lgpd_consent" BOOLEAN NOT NULL DEFAULT false,
    "lgpd_consent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_public_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: scheduling_requests
CREATE TABLE "scheduling_requests" (
    "id" TEXT NOT NULL,
    "driver_profile_id" TEXT NOT NULL,
    "passenger_name" TEXT NOT NULL,
    "passenger_whatsapp" TEXT NOT NULL,
    "origin_address" TEXT NOT NULL,
    "destination_address" TEXT NOT NULL,
    "scheduled_date" TEXT NOT NULL,
    "scheduled_time" TEXT NOT NULL,
    "passenger_count" INTEGER NOT NULL DEFAULT 1,
    "luggage_count" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "passenger_consent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduling_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driver_public_profiles_user_id_key" ON "driver_public_profiles"("user_id");
CREATE UNIQUE INDEX "driver_public_profiles_slug_key" ON "driver_public_profiles"("slug");

-- AddForeignKey
ALTER TABLE "driver_public_profiles" ADD CONSTRAINT "driver_public_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling_requests" ADD CONSTRAINT "scheduling_requests_driver_profile_id_fkey" FOREIGN KEY ("driver_profile_id") REFERENCES "driver_public_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
