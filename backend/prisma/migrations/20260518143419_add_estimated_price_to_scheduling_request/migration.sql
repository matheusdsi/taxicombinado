-- AlterTable
ALTER TABLE "scheduling_requests" ADD COLUMN     "estimated_distance_km" DOUBLE PRECISION,
ADD COLUMN     "estimated_price_max" DOUBLE PRECISION,
ADD COLUMN     "estimated_price_min" DOUBLE PRECISION;
