-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('Pending', 'Active', 'Suspended', 'Inactive');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('AirtelMoney', 'TNMMpamba', 'USSD', 'Bank', 'Cash');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Completed', 'Failed', 'Reversed', 'Refunded');

-- CreateTable
CREATE TABLE "Council" (
    "council_id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "logo_url" VARCHAR(255),
    "contact_email" VARCHAR(100),
    "contact_phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Council_pkey" PRIMARY KEY ("council_id")
);

-- CreateTable
CREATE TABLE "SubOffice" (
    "sub_office_id" SERIAL NOT NULL,
    "council_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "location" VARCHAR(150) NOT NULL,

    CONSTRAINT "SubOffice_pkey" PRIMARY KEY ("sub_office_id")
);

-- CreateTable
CREATE TABLE "Market" (
    "market_id" SERIAL NOT NULL,
    "council_id" INTEGER NOT NULL,
    "sub_office_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "location" VARCHAR(150) NOT NULL,

    CONSTRAINT "Market_pkey" PRIMARY KEY ("market_id")
);

-- CreateTable
CREATE TABLE "MarketSection" (
    "section_id" SERIAL NOT NULL,
    "market_id" INTEGER NOT NULL,
    "section_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "MarketSection_pkey" PRIMARY KEY ("section_id")
);

-- CreateTable
CREATE TABLE "Role" (
    "role_id" SERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "permission_id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("permission_id")
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "council_id" INTEGER,
    "role_id" INTEGER NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "mobile_number" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Collector" (
    "collector_id" SERIAL NOT NULL,
    "council_id" INTEGER NOT NULL,
    "sub_office_id" INTEGER,
    "full_name" VARCHAR(100) NOT NULL,
    "mobile_number" VARCHAR(20) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Collector_pkey" PRIMARY KEY ("collector_id")
);

-- CreateTable
CREATE TABLE "Supervisor" (
    "supervisor_id" SERIAL NOT NULL,
    "council_id" INTEGER NOT NULL,
    "sub_office_id" INTEGER,
    "full_name" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Supervisor_pkey" PRIMARY KEY ("supervisor_id")
);

-- CreateTable
CREATE TABLE "BusinessType" (
    "business_type_id" SERIAL NOT NULL,
    "council_id" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "fee_amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "BusinessType_pkey" PRIMARY KEY ("business_type_id")
);

-- CreateTable
CREATE TABLE "Business" (
    "business_id" SERIAL NOT NULL,
    "vendor_number" VARCHAR(20) NOT NULL,
    "council_id" INTEGER NOT NULL,
    "market_id" INTEGER NOT NULL,
    "section_id" INTEGER,
    "business_type_id" INTEGER NOT NULL,
    "registered_by_collector_id" INTEGER,
    "business_name" VARCHAR(150) NOT NULL,
    "owner_name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "national_id" VARCHAR(50),
    "email" VARCHAR(100),
    "block" VARCHAR(20),
    "stall_number" VARCHAR(20),
    "gps_latitude" DECIMAL(10,8),
    "gps_longitude" DECIMAL(11,8),
    "preferred_wallet" VARCHAR(20) NOT NULL,
    "wallet_number" VARCHAR(20) NOT NULL,
    "status" "BusinessStatus" NOT NULL DEFAULT 'Pending',
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("business_id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "payment_id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "collector_id" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "fee_type" VARCHAR(50) NOT NULL,
    "payment_channel" "PaymentChannel" NOT NULL,
    "transaction_ref" VARCHAR(100),
    "provider_ref" VARCHAR(100),
    "status" "PaymentStatus" NOT NULL DEFAULT 'Pending',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sms_sent" BOOLEAN NOT NULL DEFAULT false,
    "receipt_generated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "ApiClient" (
    "api_client_id" SERIAL NOT NULL,
    "council_id" INTEGER,
    "name" VARCHAR(100) NOT NULL,
    "contact_email" VARCHAR(100) NOT NULL,
    "contact_phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiClient_pkey" PRIMARY KEY ("api_client_id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "api_key_id" SERIAL NOT NULL,
    "api_client_id" INTEGER NOT NULL,
    "key_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "permissions" VARCHAR(255) NOT NULL,
    "rate_limit" INTEGER NOT NULL DEFAULT 1000,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("api_key_id")
);

-- CreateTable
CREATE TABLE "RevenueSummary" (
    "summary_id" SERIAL NOT NULL,
    "council_id" INTEGER NOT NULL,
    "sub_office_id" INTEGER NOT NULL,
    "market_id" INTEGER NOT NULL,
    "summary_date" DATE NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "total_transactions" INTEGER NOT NULL,
    "successful_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RevenueSummary_pkey" PRIMARY KEY ("summary_id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "log_id" SERIAL NOT NULL,
    "council_id" INTEGER,
    "user_id" INTEGER,
    "actor_type" VARCHAR(20) NOT NULL,
    "actor_id" INTEGER,
    "actor_name" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "resource_id" VARCHAR(50),
    "details" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notification_id" SERIAL NOT NULL,
    "recipient_type" VARCHAR(20) NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'Pending',
    "content" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_name_key" ON "Role"("role_name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Collector_username_key" ON "Collector"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Supervisor_username_key" ON "Supervisor"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Business_vendor_number_key" ON "Business"("vendor_number");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transaction_ref_key" ON "Payment"("transaction_ref");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueSummary_market_id_summary_date_key" ON "RevenueSummary"("market_id", "summary_date");

-- AddForeignKey
ALTER TABLE "SubOffice" ADD CONSTRAINT "SubOffice_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "Council"("council_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "Council"("council_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Market" ADD CONSTRAINT "Market_sub_office_id_fkey" FOREIGN KEY ("sub_office_id") REFERENCES "SubOffice"("sub_office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketSection" ADD CONSTRAINT "MarketSection_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market"("market_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "Council"("council_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collector" ADD CONSTRAINT "Collector_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "Council"("council_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collector" ADD CONSTRAINT "Collector_sub_office_id_fkey" FOREIGN KEY ("sub_office_id") REFERENCES "SubOffice"("sub_office_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervisor" ADD CONSTRAINT "Supervisor_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "Council"("council_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervisor" ADD CONSTRAINT "Supervisor_sub_office_id_fkey" FOREIGN KEY ("sub_office_id") REFERENCES "SubOffice"("sub_office_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessType" ADD CONSTRAINT "BusinessType_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "Council"("council_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "Council"("council_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market"("market_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "MarketSection"("section_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_business_type_id_fkey" FOREIGN KEY ("business_type_id") REFERENCES "BusinessType"("business_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Business" ADD CONSTRAINT "Business_registered_by_collector_id_fkey" FOREIGN KEY ("registered_by_collector_id") REFERENCES "Collector"("collector_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("business_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_collector_id_fkey" FOREIGN KEY ("collector_id") REFERENCES "Collector"("collector_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiClient" ADD CONSTRAINT "ApiClient_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "Council"("council_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_api_client_id_fkey" FOREIGN KEY ("api_client_id") REFERENCES "ApiClient"("api_client_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSummary" ADD CONSTRAINT "RevenueSummary_sub_office_id_fkey" FOREIGN KEY ("sub_office_id") REFERENCES "SubOffice"("sub_office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSummary" ADD CONSTRAINT "RevenueSummary_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market"("market_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_council_id_fkey" FOREIGN KEY ("council_id") REFERENCES "Council"("council_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
