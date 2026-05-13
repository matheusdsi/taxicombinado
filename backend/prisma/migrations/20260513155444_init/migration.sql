-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "password_hash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'driver',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anonymous_sessions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_agent" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymous_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "fuel_type" TEXT NOT NULL DEFAULT 'gasoline',
    "consumption_km_per_liter" DOUBLE PRECISION NOT NULL,
    "extra_cost_per_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxi_fare_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "base_fare" DOUBLE PRECISION NOT NULL,
    "price_per_km" DOUBLE PRECISION NOT NULL,
    "waiting_price" DOUBLE PRECISION NOT NULL,
    "waiting_charge_type" TEXT NOT NULL DEFAULT 'per_minute',
    "flag_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taxi_fare_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "anonymous_session_id" TEXT,
    "vehicle_id" TEXT,
    "taxi_fare_profile_id" TEXT,
    "origin_address" TEXT,
    "destination_address" TEXT,
    "trip_type" TEXT NOT NULL DEFAULT 'one_way',
    "route_mode" TEXT NOT NULL DEFAULT 'manual',
    "distance_km" DOUBLE PRECISION NOT NULL,
    "return_distance_km" DOUBLE PRECISION,
    "total_distance_km" DOUBLE PRECISION NOT NULL,
    "estimated_minutes" DOUBLE PRECISION NOT NULL,
    "consumption_km_per_liter" DOUBLE PRECISION NOT NULL,
    "fuel_price_per_liter" DOUBLE PRECISION NOT NULL,
    "fuel_type" TEXT NOT NULL DEFAULT 'gasoline',
    "vehicle_extra_cost_per_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "base_fare" DOUBLE PRECISION NOT NULL,
    "price_per_km" DOUBLE PRECISION NOT NULL,
    "waiting_price" DOUBLE PRECISION NOT NULL,
    "waiting_charge_type" TEXT NOT NULL DEFAULT 'per_minute',
    "flag_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "toll_outbound" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "toll_return" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parking_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extra_costs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "desired_margin_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driver_minimum_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "custom_charged_price" DOUBLE PRECISION,
    "fuel_cost" DOUBLE PRECISION NOT NULL,
    "vehicle_extra_cost" DOUBLE PRECISION NOT NULL,
    "toll_total" DOUBLE PRECISION NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "time_charge" DOUBLE PRECISION NOT NULL,
    "fare_price" DOUBLE PRECISION NOT NULL,
    "minimum_price" DOUBLE PRECISION NOT NULL,
    "recommended_price" DOUBLE PRECISION NOT NULL,
    "ideal_price" DOUBLE PRECISION NOT NULL,
    "profit" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "alerts" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_stops" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_events" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "website_url" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_clicks" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "anonymous_id" TEXT,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_leads" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT,
    "anonymous_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_route_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "origin_city" TEXT,
    "destination_city" TEXT,
    "trip_type" TEXT NOT NULL,
    "total_quotes" INTEGER NOT NULL DEFAULT 0,
    "avg_distance_km" DOUBLE PRECISION,
    "avg_recommended_price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_route_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_analytics" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "total_quotes" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "city_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_feedback" (
    "id" TEXT NOT NULL,
    "anonymous_id" TEXT,
    "rating" INTEGER NOT NULL,
    "category" TEXT,
    "message" TEXT,
    "page" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_sessions_session_id_key" ON "anonymous_sessions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_route_analytics_date_origin_city_destination_city_tri_key" ON "daily_route_analytics"("date", "origin_city", "destination_city", "trip_type");

-- CreateIndex
CREATE UNIQUE INDEX "city_analytics_city_key" ON "city_analytics"("city");

-- AddForeignKey
ALTER TABLE "anonymous_sessions" ADD CONSTRAINT "anonymous_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxi_fare_profiles" ADD CONSTRAINT "taxi_fare_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_anonymous_session_id_fkey" FOREIGN KEY ("anonymous_session_id") REFERENCES "anonymous_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_taxi_fare_profile_id_fkey" FOREIGN KEY ("taxi_fare_profile_id") REFERENCES "taxi_fare_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_stops" ADD CONSTRAINT "quote_stops_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_events" ADD CONSTRAINT "quote_events_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_clicks" ADD CONSTRAINT "partner_clicks_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_leads" ADD CONSTRAINT "partner_leads_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
