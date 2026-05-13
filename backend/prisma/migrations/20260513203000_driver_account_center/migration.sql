-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "brand" TEXT,
ADD COLUMN "model" TEXT,
ADD COLUMN "year" INTEGER,
ADD COLUMN "plate_nickname" TEXT,
ADD COLUMN "monthly_installment" DOUBLE PRECISION,
ADD COLUMN "monthly_insurance" DOUBLE PRECISION,
ADD COLUMN "monthly_protection" DOUBLE PRECISION,
ADD COLUMN "monthly_rental" DOUBLE PRECISION,
ADD COLUMN "monthly_parking" DOUBLE PRECISION,
ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "driver_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "city" TEXT,
    "state" TEXT,
    "taxi_point" TEXT,
    "works_with_apps" BOOLEAN,
    "accepts_pix" BOOLEAN,
    "accepts_card" BOOLEAN,
    "issues_receipt" BOOLEAN,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_monthly_costs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "personal_income_goal" DOUBLE PRECISION,
    "work_days_per_month" DOUBLE PRECISION,
    "hours_per_day" DOUBLE PRECISION,
    "monthly_km_estimate" DOUBLE PRECISION,
    "fuel_monthly_estimate" DOUBLE PRECISION,
    "car_installment" DOUBLE PRECISION,
    "car_rental" DOUBLE PRECISION,
    "insurance" DOUBLE PRECISION,
    "vehicle_protection" DOUBLE PRECISION,
    "maintenance_reserve" DOUBLE PRECISION,
    "tire_reserve" DOUBLE PRECISION,
    "oil_reserve" DOUBLE PRECISION,
    "washing" DOUBLE PRECISION,
    "parking" DOUBLE PRECISION,
    "toll_tag" DOUBLE PRECISION,
    "phone_bill" DOUBLE PRECISION,
    "app_fees" DOUBLE PRECISION,
    "accountant" DOUBLE PRECISION,
    "license_and_taxes" DOUBLE PRECISION,
    "other_fixed_costs" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_monthly_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "odometer_km" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuel_type" TEXT NOT NULL DEFAULT 'gasoline',
    "liters" DOUBLE PRECISION,
    "total_paid" DOUBLE PRECISION NOT NULL,
    "price_per_liter" DOUBLE PRECISION,
    "odometer_km" DOUBLE PRECISION,
    "station" TEXT,
    "city" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_user_id_key" ON "driver_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_monthly_costs_user_id_key" ON "driver_monthly_costs"("user_id");

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_monthly_costs" ADD CONSTRAINT "driver_monthly_costs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_logs" ADD CONSTRAINT "maintenance_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
