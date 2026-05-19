CREATE TABLE "app_events" (
    "id" TEXT NOT NULL,
    "anonymous_id" TEXT,
    "event_type" TEXT NOT NULL,
    "platform" TEXT,
    "metadata" JSONB,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_events_pkey" PRIMARY KEY ("id")
);
