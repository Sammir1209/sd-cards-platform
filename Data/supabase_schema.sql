-- ============================================================================
-- S & D - COMPANY CARDS: ESQUEMA DEFINITIVO PARA SUPABASE (POSTGRESQL)
-- Proyecto: S&D - Company (Listo para Producción)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> Run
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: Negocios / Clientes Compradores
CREATE TABLE IF NOT EXISTS "Businesses" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(150) NOT NULL,
    "Slug" VARCHAR(80) NOT NULL UNIQUE,
    "CustomDomain" VARCHAR(150),
    "TemplateType" INTEGER NOT NULL DEFAULT 1, -- 1: MenuDigital, 2: GoogleReviews, 3: Ambos
    "Sector" INTEGER NOT NULL DEFAULT 0,       -- 1: Polleria, 2: Jugueria, 3: Cafeteria, etc.
    "City" VARCHAR(100) DEFAULT 'Lima',
    "Address" VARCHAR(200),
    "GooglePlaceId" VARCHAR(150),
    "GoogleMapsUrl" TEXT,
    "OwnerName" VARCHAR(100),
    "OwnerPhone" VARCHAR(30),
    "Ruc" VARCHAR(20),
    "Department" VARCHAR(100),
    "Province" VARCHAR(100),
    "District" VARCHAR(100),
    "PlanMonths" INTEGER NOT NULL DEFAULT 12,
    "PlanExpiryDate" TIMESTAMP WITH TIME ZONE,
    "AutoRedirectReviews" BOOLEAN NOT NULL DEFAULT TRUE,
    "LogoUrl" VARCHAR(500),
    "PrimaryColor" VARCHAR(7) NOT NULL DEFAULT '#00E5FF',
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Si la tabla "Businesses" ya existía sin las columnas de Ubigeo, RUC o Plan, las agregamos con seguridad:
ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "Ruc" VARCHAR(20);
ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "Department" VARCHAR(100);
ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "Province" VARCHAR(100);
ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "District" VARCHAR(100);
ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "PlanMonths" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "PlanExpiryDate" TIMESTAMP WITH TIME ZONE;

CREATE UNIQUE INDEX IF NOT EXISTS "IX_Businesses_CustomDomain_Filtered"
ON "Businesses" ("CustomDomain")
WHERE "CustomDomain" IS NOT NULL AND "CustomDomain" != '';

-- 2. TABLA: Perfiles de Usuario & Roles
CREATE TABLE IF NOT EXISTS "UserProfiles" (
    "Id" UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "Email" VARCHAR(150) NOT NULL UNIQUE,
    "Role" VARCHAR(30) NOT NULL DEFAULT 'Buyer', -- 'SuperAdmin' o 'Buyer'
    "BusinessId" INTEGER REFERENCES "Businesses"("Id") ON DELETE SET NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Si la tabla ya existía sin la columna "BusinessId", la agregamos con seguridad:
ALTER TABLE "UserProfiles" ADD COLUMN IF NOT EXISTS "BusinessId" INTEGER REFERENCES "Businesses"("Id") ON DELETE SET NULL;

-- 3. TABLA: Tarjetas Físicas NFC NTAG215
CREATE TABLE IF NOT EXISTS "NfcCards" (
    "Id" SERIAL PRIMARY KEY,
    "CardCode" VARCHAR(50) NOT NULL UNIQUE,
    "BusinessId" INTEGER NOT NULL REFERENCES "Businesses"("Id") ON DELETE CASCADE,
    "CardType" INTEGER NOT NULL DEFAULT 2,     -- 1: MenuDigital, 2: GoogleReviews
    "Status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- INVENTORY, ASSIGNED, PROGRAMMED, ACTIVE, SUSPENDED
    "Label" VARCHAR(80) NOT NULL DEFAULT 'Mesa Principal',
    "ActivationPin" VARCHAR(10) NOT NULL DEFAULT '1234',
    "TapCount" INTEGER NOT NULL DEFAULT 0,
    "NfcUid" VARCHAR(50),
    "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "ProgrammedAt" TIMESTAMP WITH TIME ZONE,
    "ActivatedAt" TIMESTAMP WITH TIME ZONE,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía previamente
ALTER TABLE "NfcCards" ADD COLUMN IF NOT EXISTS "Status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "NfcCards" ADD COLUMN IF NOT EXISTS "NfcUid" VARCHAR(50);
ALTER TABLE "NfcCards" ADD COLUMN IF NOT EXISTS "ProgrammedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "NfcCards" ADD COLUMN IF NOT EXISTS "ActivatedAt" TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS "IX_NfcCards_BusinessId" ON "NfcCards"("BusinessId");
CREATE INDEX IF NOT EXISTS "IX_NfcCards_CardCode" ON "NfcCards"("CardCode");

-- 4. TABLA: Categorías del Menú
CREATE TABLE IF NOT EXISTS "Categories" (
    "Id" SERIAL PRIMARY KEY,
    "BusinessId" INTEGER NOT NULL REFERENCES "Businesses"("Id") ON DELETE CASCADE,
    "Name" VARCHAR(100) NOT NULL,
    "DisplayOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "IX_Categories_BusinessId" ON "Categories"("BusinessId");

-- 5. TABLA: Platos del Menú
CREATE TABLE IF NOT EXISTS "Dishes" (
    "Id" SERIAL PRIMARY KEY,
    "CategoryId" INTEGER NOT NULL REFERENCES "Categories"("Id") ON DELETE CASCADE,
    "Name" VARCHAR(150) NOT NULL,
    "Description" VARCHAR(500),
    "Price" DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    "ImageUrl" VARCHAR(500),
    "IsAvailable" BOOLEAN NOT NULL DEFAULT TRUE,
    "DisplayOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "IX_Dishes_CategoryId" ON "Dishes"("CategoryId");

-- 6. REGISTRO AUTOMÁTICO DE SUPERADMIN (CORREGIDO SIN FullName)
INSERT INTO "UserProfiles" ("Id", "Email", "Role")
SELECT id, email, 'SuperAdmin'
FROM auth.users 
WHERE email = 'samirconter@gmail.com'
ON CONFLICT ("Email") DO UPDATE 
SET "Role" = 'SuperAdmin';

-- 7. SEED INICIAL DE NEGOCIO PILOTO (Pollería Ben 10)
INSERT INTO "Businesses" ("Id", "Name", "Slug", "TemplateType", "Sector", "OwnerName", "OwnerPhone")
VALUES (1, 'Pollería Ben 10', 'polleria-ben-10', 1, 1, 'Samir Conter', '+51999888777')
ON CONFLICT ("Id") DO NOTHING;
