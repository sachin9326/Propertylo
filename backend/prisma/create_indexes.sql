-- Run this SQL on your Neon database to create performance indexes
-- These indexes eliminate full table scans and bring query times from seconds to milliseconds

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Property_type_idx" ON "Property" ("type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Property_city_idx" ON "Property" ("city");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Property_category_idx" ON "Property" ("category");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Property_bhk_idx" ON "Property" ("bhk");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Property_propertyType_idx" ON "Property" ("propertyType");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Property_price_idx" ON "Property" ("price");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Property_createdAt_idx" ON "Property" ("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Property_type_city_category_idx" ON "Property" ("type", "city", "category");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Property_type_createdAt_idx" ON "Property" ("type", "createdAt" DESC);
