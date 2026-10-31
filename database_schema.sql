-- =============================================================================
-- ESQUEMA COMPLETO PARA SUPABASE / POSTGRESQL (UN SOLO CODIGO SQL)
-- Copiar y pegar directamente en el SQL Editor de Supabase
-- =============================================================================

-- 1. TABLA: Businesses (Negocios / Clientes)
CREATE TABLE IF NOT EXISTS "Businesses" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(200) NOT NULL,
    "Slug" VARCHAR(100) NOT NULL UNIQUE,
    "CustomDomain" VARCHAR(150),
    "TemplateType" INTEGER NOT NULL DEFAULT 1,
    "Sector" INTEGER NOT NULL DEFAULT 1,
    "Ruc" VARCHAR(20),
    "Department" VARCHAR(100),
    "Province" VARCHAR(100),
    "District" VARCHAR(100),
    "City" VARCHAR(100),
    "Address" VARCHAR(250),
    "PlanMonths" INTEGER NOT NULL DEFAULT 12,
    "PlanExpiryDate" TIMESTAMPTZ,
    "GooglePlaceId" VARCHAR(150),
    "OwnerName" VARCHAR(150),
    "OwnerPhone" VARCHAR(50),
    "OwnerEmail" VARCHAR(150),
    "AccessPassword" VARCHAR(200),
    "GoogleMapsUrl" TEXT,
    "AutoRedirectReviews" BOOLEAN NOT NULL DEFAULT TRUE,
    "LogoUrl" TEXT,
    "PrimaryColor" VARCHAR(20) NOT NULL DEFAULT '#2563EB',
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "IsArchived" BOOLEAN NOT NULL DEFAULT FALSE,
    "WhatsappOptIn" BOOLEAN NOT NULL DEFAULT TRUE,
    "LastNotificationAt" TIMESTAMPTZ,
    "ActiveRoutingMode" INTEGER NOT NULL DEFAULT 1,
    "WifiPassword" VARCHAR(100),
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices para Businesses
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Businesses_Slug" ON "Businesses" ("Slug");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Businesses_CustomDomain" ON "Businesses" ("CustomDomain") WHERE "CustomDomain" IS NOT NULL AND "CustomDomain" <> '';
CREATE INDEX IF NOT EXISTS "IX_Businesses_OwnerEmail" ON "Businesses" ("OwnerEmail");

-- 2. TABLA: Categories (Categorias de Menú)
CREATE TABLE IF NOT EXISTS "Categories" (
    "Id" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL REFERENCES "Businesses"("Id") ON DELETE CASCADE,
    "Name" VARCHAR(150) NOT NULL,
    "DisplayOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "IX_Categories_BusinessId" ON "Categories" ("BusinessId");

-- 3. TABLA: Dishes (Platos / Servicios)
CREATE TABLE IF NOT EXISTS "Dishes" (
    "Id" SERIAL PRIMARY KEY,
    "CategoryId" INTEGER NOT NULL REFERENCES "Categories"("Id") ON DELETE CASCADE,
    "Name" VARCHAR(200) NOT NULL,
    "Description" TEXT,
    "Price" NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    "ImageUrl" TEXT,
    "IsAvailable" BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS "IX_Dishes_CategoryId" ON "Dishes" ("CategoryId");

-- 4. TABLA: NfcCards (Tarjetas Fisicas NFC)
CREATE TABLE IF NOT EXISTS "NfcCards" (
    "Id" SERIAL PRIMARY KEY,
    "CardCode" VARCHAR(100) NOT NULL UNIQUE,
    "BusinessId" INTEGER NOT NULL REFERENCES "Businesses"("Id") ON DELETE CASCADE,
    "CardType" INTEGER NOT NULL DEFAULT 1,
    "Label" VARCHAR(100) NOT NULL,
    "IsConfigured" BOOLEAN NOT NULL DEFAULT FALSE,
    "ActivationPin" VARCHAR(20) NOT NULL DEFAULT '1234',
    "TapCount" INTEGER NOT NULL DEFAULT 0,
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "Status" VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
    "NfcUid" VARCHAR(50),
    "ProgrammedAt" TIMESTAMPTZ,
    "ActivatedAt" TIMESTAMPTZ,
    "ProvisionToken" VARCHAR(100),
    "ProvisionExpiresAt" TIMESTAMPTZ,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_NfcCards_BusinessId" ON "NfcCards" ("BusinessId");
CREATE INDEX IF NOT EXISTS "IX_NfcCards_NfcUid" ON "NfcCards" ("NfcUid");
