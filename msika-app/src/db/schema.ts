// ============================================================
// Drizzle schema — exact mirror of the existing PostgreSQL
// database (previously managed via Prisma). Table and column
// names, types, defaults, and constraints are unchanged so the
// swap is invisible to the running system.
// ============================================================
import {
  pgTable, serial, varchar, text, boolean, integer, numeric,
  timestamp, date, uniqueIndex, pgEnum,
} from "drizzle-orm/pg-core";

export const businessStatus = pgEnum("BusinessStatus", ["Pending", "Active", "Suspended", "Inactive"]);
export const paymentChannel = pgEnum("PaymentChannel", ["AirtelMoney", "TNMMpamba", "USSD", "Bank", "Cash"]);
export const paymentStatus = pgEnum("PaymentStatus", ["Pending", "Completed", "Failed", "Reversed", "Refunded"]);

export const councils = pgTable("Council", {
  council_id: serial("council_id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  logo_url: varchar("logo_url", { length: 255 }),
  contact_email: varchar("contact_email", { length: 100 }),
  contact_phone: varchar("contact_phone", { length: 20 }),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const subOffices = pgTable("SubOffice", {
  sub_office_id: serial("sub_office_id").primaryKey(),
  council_id: integer("council_id")
    .notNull()
    .references(() => councils.council_id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  location: varchar("location", { length: 150 }).notNull(),
});

export const markets = pgTable("Market", {
  market_id: serial("market_id").primaryKey(),
  council_id: integer("council_id")
    .notNull()
    .references(() => councils.council_id, { onDelete: "cascade" }),
  sub_office_id: integer("sub_office_id")
    .notNull()
    .references(() => subOffices.sub_office_id),
  name: varchar("name", { length: 100 }).notNull(),
  location: varchar("location", { length: 150 }).notNull(),
});

export const marketSections = pgTable("MarketSection", {
  section_id: serial("section_id").primaryKey(),
  market_id: integer("market_id")
    .notNull()
    .references(() => markets.market_id, { onDelete: "cascade" }),
  section_name: varchar("section_name", { length: 100 }).notNull(),
});

export const roles = pgTable("Role", {
  role_id: serial("role_id").primaryKey(),
  role_name: varchar("role_name", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
});

export const permissions = pgTable("Permission", {
  permission_id: serial("permission_id").primaryKey(),
  role_id: integer("role_id")
    .notNull()
    .references(() => roles.role_id, { onDelete: "cascade" }),
  resource: varchar("resource", { length: 50 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
});

export const users = pgTable("User", {
  user_id: serial("user_id").primaryKey(),
  council_id: integer("council_id").references(() => councils.council_id),
  role_id: integer("role_id")
    .notNull()
    .references(() => roles.role_id),
  full_name: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 100 }),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  mobile_number: varchar("mobile_number", { length: 20 }),
  is_active: boolean("is_active").notNull().default(true),
  last_login: timestamp("last_login", { mode: "date" }),
  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const collectors = pgTable("Collector", {
  collector_id: serial("collector_id").primaryKey(),
  council_id: integer("council_id")
    .notNull()
    .references(() => councils.council_id),
  sub_office_id: integer("sub_office_id").references(() => subOffices.sub_office_id),
  full_name: varchar("full_name", { length: 100 }).notNull(),
  mobile_number: varchar("mobile_number", { length: 20 }).notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  is_active: boolean("is_active").notNull().default(true),
});

export const supervisors = pgTable("Supervisor", {
  supervisor_id: serial("supervisor_id").primaryKey(),
  council_id: integer("council_id")
    .notNull()
    .references(() => councils.council_id),
  sub_office_id: integer("sub_office_id").references(() => subOffices.sub_office_id),
  full_name: varchar("full_name", { length: 100 }).notNull(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  is_active: boolean("is_active").notNull().default(true),
});

export const businessTypes = pgTable("BusinessType", {
  business_type_id: serial("business_type_id").primaryKey(),
  council_id: integer("council_id").references(() => councils.council_id),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  fee_amount: numeric("fee_amount", { precision: 10, scale: 2 }).notNull(),
});

export const businesses = pgTable("Business", {
  business_id: serial("business_id").primaryKey(),
  vendor_number: varchar("vendor_number", { length: 20 }).notNull().unique(),
  council_id: integer("council_id")
    .notNull()
    .references(() => councils.council_id),
  market_id: integer("market_id")
    .notNull()
    .references(() => markets.market_id),
  section_id: integer("section_id").references(() => marketSections.section_id),
  business_type_id: integer("business_type_id")
    .notNull()
    .references(() => businessTypes.business_type_id),
  registered_by_collector_id: integer("registered_by_collector_id").references(() => collectors.collector_id),
  business_name: varchar("business_name", { length: 150 }).notNull(),
  owner_name: varchar("owner_name", { length: 100 }).notNull(),
  phone_number: varchar("phone_number", { length: 20 }).notNull(),
  national_id: varchar("national_id", { length: 50 }),
  email: varchar("email", { length: 100 }),
  block: varchar("block", { length: 20 }),
  stall_number: varchar("stall_number", { length: 20 }),
  gps_latitude: numeric("gps_latitude", { precision: 10, scale: 8 }),
  gps_longitude: numeric("gps_longitude", { precision: 11, scale: 8 }),
  preferred_wallet: varchar("preferred_wallet", { length: 20 }).notNull(),
  wallet_number: varchar("wallet_number", { length: 20 }).notNull(),
  status: businessStatus("status").notNull().default("Pending"),
  registration_date: timestamp("registration_date", { mode: "date" }).notNull().defaultNow(),
});

export const payments = pgTable("Payment", {
  payment_id: serial("payment_id").primaryKey(),
  business_id: integer("business_id")
    .notNull()
    .references(() => businesses.business_id),
  collector_id: integer("collector_id").references(() => collectors.collector_id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  fee_type: varchar("fee_type", { length: 50 }).notNull(),
  payment_channel: paymentChannel("payment_channel").notNull(),
  transaction_ref: varchar("transaction_ref", { length: 100 }).unique(),
  provider_ref: varchar("provider_ref", { length: 100 }),
  status: paymentStatus("status").notNull().default("Pending"),
  paid_at: timestamp("paid_at", { mode: "date" }),
  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  sms_sent: boolean("sms_sent").notNull().default(false),
  receipt_generated: boolean("receipt_generated").notNull().default(false),
});

export const apiClients = pgTable("ApiClient", {
  api_client_id: serial("api_client_id").primaryKey(),
  council_id: integer("council_id").references(() => councils.council_id),
  name: varchar("name", { length: 100 }).notNull(),
  contact_email: varchar("contact_email", { length: 100 }).notNull(),
  contact_phone: varchar("contact_phone", { length: 20 }),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const apiKeys = pgTable("ApiKey", {
  api_key_id: serial("api_key_id").primaryKey(),
  api_client_id: integer("api_client_id")
    .notNull()
    .references(() => apiClients.api_client_id, { onDelete: "cascade" }),
  key_hash: varchar("key_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 50 }).notNull(),
  permissions: varchar("permissions", { length: 255 }).notNull(),
  rate_limit: integer("rate_limit").notNull().default(1000),
  last_used_at: timestamp("last_used_at", { mode: "date" }),
  expires_at: timestamp("expires_at", { mode: "date" }),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const revenueSummaries = pgTable(
  "RevenueSummary",
  {
    summary_id: serial("summary_id").primaryKey(),
    council_id: integer("council_id").notNull(),
    sub_office_id: integer("sub_office_id")
      .notNull()
      .references(() => subOffices.sub_office_id),
    market_id: integer("market_id")
      .notNull()
      .references(() => markets.market_id),
    summary_date: date("summary_date").notNull(),
    total_amount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
    total_transactions: integer("total_transactions").notNull(),
    successful_count: integer("successful_count").notNull().default(0),
    failed_count: integer("failed_count").notNull().default(0),
  },
  (t) => [uniqueIndex("RevenueSummary_market_id_summary_date_key").on(t.market_id, t.summary_date)]
);

export const auditLogs = pgTable("AuditLog", {
  log_id: serial("log_id").primaryKey(),
  council_id: integer("council_id").references(() => councils.council_id),
  user_id: integer("user_id").references(() => users.user_id),
  actor_type: varchar("actor_type", { length: 20 }).notNull(),
  actor_id: integer("actor_id"),
  actor_name: varchar("actor_name", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  resource: varchar("resource", { length: 50 }).notNull(),
  resource_id: varchar("resource_id", { length: 50 }),
  details: text("details"),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull().defaultNow(),
});

export const notifications = pgTable("Notification", {
  notification_id: serial("notification_id").primaryKey(),
  recipient_type: varchar("recipient_type", { length: 20 }).notNull(),
  recipient_id: integer("recipient_id").notNull(),
  type: varchar("type", { length: 30 }).notNull(),
  channel: varchar("channel", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("Pending"),
  content: text("content").notNull(),
  sent_at: timestamp("sent_at", { mode: "date" }),
  created_at: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
