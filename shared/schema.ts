import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for both Replit Auth and local email/password
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For local auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  authType: varchar("auth_type", { length: 20 }).default("replit"), // 'replit' or 'local'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenants (buyer organizations)
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).unique(),
  settings: jsonb("settings").$type<{
    companyType: 'manufacturing' | 'service';
    industry: string;
    preferences: Record<string, any>;
  }>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tenant users (suppliers belong to tenants)
export const tenantUsers = pgTable("tenant_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 50 }).notNull().default('supplier'),
  companyName: varchar("company_name", { length: 255 }),
  companyType: varchar("company_type", { length: 50 }).$type<'manufacturing' | 'service'>(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Supplier profiles
export const supplierProfiles = pgTable("supplier_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  companyType: varchar("company_type", { length: 50 }).$type<'manufacturing' | 'service'>().notNull(),
  businessLicense: varchar("business_license", { length: 100 }),
  taxId: varchar("tax_id", { length: 50 }),
  bankDetails: jsonb("bank_details").$type<{
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    isVerified: boolean;
  }>(),
  contactInfo: jsonb("contact_info").$type<{
    phone: string;
    address: string;
    website?: string;
  }>(),
  capabilities: jsonb("capabilities").$type<{
    skills?: string[];
    productionCapacity?: number;
    certifications?: string[];
    locations?: string[];
  }>(),
  onboardingStatus: varchar("onboarding_status", { length: 50 }).default('pending'),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  supplierId: varchar("supplier_id").references(() => users.id).notNull(),
  orderNumber: varchar("order_number", { length: 100 }).notNull(),
  orderType: varchar("order_type", { length: 50 }).$type<'purchase_order' | 'work_order'>().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  status: varchar("status", { length: 50 }).default('draft'),
  dueDate: timestamp("due_date"),
  deliveryDate: timestamp("delivery_date"),
  lineItems: jsonb("line_items").$type<Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    sku?: string;
  }>>(),
  attachments: jsonb("attachments").$type<Array<{
    id: string;
    filename: string;
    url: string;
    uploadedAt: string;
  }>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  supplierId: varchar("supplier_id").references(() => users.id).notNull(),
  purchaseOrderId: uuid("purchase_order_id").references(() => purchaseOrders.id),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  status: varchar("status", { length: 50 }).default('draft'),
  issueDate: timestamp("issue_date").defaultNow(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }),
  lineItems: jsonb("line_items").$type<Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>(),
  attachments: jsonb("attachments").$type<Array<{
    id: string;
    filename: string;
    url: string;
    uploadedAt: string;
  }>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }),
  fileSize: integer("file_size"),
  category: varchar("category", { length: 100 }),
  tags: jsonb("tags").$type<string[]>(),
  url: varchar("url", { length: 500 }),
  isPublic: boolean("is_public").default(false),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id),
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).default('message'),
  priority: varchar("priority", { length: 50 }).default('normal'),
  isRead: boolean("is_read").default(false),
  attachments: jsonb("attachments").$type<Array<{
    id: string;
    filename: string;
    url: string;
  }>>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Performance metrics
export const performanceMetrics = pgTable("performance_metrics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  supplierId: varchar("supplier_id").references(() => users.id).notNull(),
  metricType: varchar("metric_type", { length: 100 }).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  period: varchar("period", { length: 50 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  tenantUsers: many(tenantUsers),
  supplierProfiles: many(supplierProfiles),
  purchaseOrders: many(purchaseOrders),
  invoices: many(invoices),
  documents: many(documents),
  messages: many(messages),
  performanceMetrics: many(performanceMetrics),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tenantUsers: many(tenantUsers),
  supplierProfiles: many(supplierProfiles),
  sentPurchaseOrders: many(purchaseOrders),
  invoices: many(invoices),
  documents: many(documents),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  performanceMetrics: many(performanceMetrics),
}));

export const tenantUsersRelations = relations(tenantUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantUsers.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantUsers.userId],
    references: [users.id],
  }),
}));

export const supplierProfilesRelations = relations(supplierProfiles, ({ one }) => ({
  tenant: one(tenants, {
    fields: [supplierProfiles.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [supplierProfiles.userId],
    references: [users.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [purchaseOrders.tenantId],
    references: [tenants.id],
  }),
  supplier: one(users, {
    fields: [purchaseOrders.supplierId],
    references: [users.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  tenant: one(tenants, {
    fields: [invoices.tenantId],
    references: [tenants.id],
  }),
  supplier: one(users, {
    fields: [invoices.supplierId],
    references: [users.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [invoices.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  tenant: one(tenants, {
    fields: [messages.tenantId],
    references: [tenants.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  tenant: one(tenants, {
    fields: [performanceMetrics.tenantId],
    references: [tenants.id],
  }),
  supplier: one(users, {
    fields: [performanceMetrics.supplierId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants);
export const insertTenantUserSchema = createInsertSchema(tenantUsers);
export const insertSupplierProfileSchema = createInsertSchema(supplierProfiles);
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const insertDocumentSchema = createInsertSchema(documents);
export const insertMessageSchema = createInsertSchema(messages);
export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type TenantUser = typeof tenantUsers.$inferSelect;
export type SupplierProfile = typeof supplierProfiles.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertTenantUser = z.infer<typeof insertTenantUserSchema>;
export type InsertSupplierProfile = z.infer<typeof insertSupplierProfileSchema>;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
