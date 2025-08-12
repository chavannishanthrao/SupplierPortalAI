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

// Vendor invitations
export const vendorInvitations = pgTable("vendor_invitations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  entityId: varchar("entity_id", { length: 255 }), // Entity selection for multi-entity organizations
  supplierName: varchar("supplier_name", { length: 255 }).notNull(),
  requestorId: varchar("requestor_id").references(() => users.id).notNull(),
  responseDueDate: timestamp("response_due_date").notNull(),
  supplierCategory: varchar("supplier_category", { length: 100 }).notNull(),
  defaultPaymentTerms: varchar("default_payment_terms", { length: 100 }).notNull(),
  
  // Primary contact details
  primaryContactFirstName: varchar("primary_contact_first_name", { length: 100 }).notNull(),
  primaryContactLastName: varchar("primary_contact_last_name", { length: 100 }).notNull(),
  primaryContactPhone: varchar("primary_contact_phone", { length: 50 }),
  primaryContactEmail: varchar("primary_contact_email", { length: 255 }).notNull(),
  
  // Secondary contact details (optional)
  secondaryContactFirstName: varchar("secondary_contact_first_name", { length: 100 }),
  secondaryContactLastName: varchar("secondary_contact_last_name", { length: 100 }),
  secondaryContactPhone: varchar("secondary_contact_phone", { length: 50 }),
  secondaryContactEmail: varchar("secondary_contact_email", { length: 255 }),
  
  // Documents and templates
  attachedDocuments: jsonb("attached_documents").$type<Array<{
    id: string;
    filename: string;
    originalName: string;
    fileType: string;
    category: string; // 'nda', 'contract', 'policy', etc.
    requiresSignature: boolean;
    url: string;
  }>>(),
  emailTemplateId: varchar("email_template_id", { length: 255 }),
  
  // Generated credentials for supplier login
  supplierEmail: varchar("supplier_email", { length: 255 }).notNull(),
  tempPassword: varchar("temp_password", { length: 255 }).notNull(),
  
  inviteToken: varchar("invite_token", { length: 255 }).unique().notNull(),
  status: varchar("status", { length: 50 }).default('draft'), // draft, pending, accepted, expired, cancelled
  invitedBy: varchar("invited_by").references(() => users.id).notNull(),
  customMessage: text("custom_message"),
  expiresAt: timestamp("expires_at"),
  acceptedAt: timestamp("accepted_at"),
  remindersSent: integer("reminders_sent").default(0),
  lastReminderAt: timestamp("last_reminder_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor onboarding forms
export const vendorOnboardingForms = pgTable("vendor_onboarding_forms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  vendorId: varchar("vendor_id").references(() => users.id),
  invitationId: uuid("invitation_id").references(() => vendorInvitations.id),
  formData: jsonb("form_data").$type<{
    businessInfo: {
      legalName: string;
      tradeName?: string;
      businessType: string;
      incorporationDate: string;
      registrationNumber: string;
      country: string;
      state?: string;
      city: string;
      address: string;
      postalCode: string;
      website?: string;
      employeeCount?: number;
    };
    taxInfo: {
      taxId: string; // PAN/TIN based on country
      vatNumber?: string;
      gstNumber?: string;
      msmeRegistration?: string;
      taxCertificates?: Array<{ type: string; number: string; expiryDate: string; fileUrl?: string }>;
    };
    bankingInfo: {
      accountHolderName: string;
      accountNumber: string;
      routingNumber: string;
      bankName: string;
      swiftCode?: string;
      currency: string;
      isVerified: boolean;
    };
    contactInfo: {
      primaryContact: {
        name: string;
        designation: string;
        email: string;
        phone: string;
      };
      financialContact?: {
        name: string;
        designation: string;
        email: string;
        phone: string;
      };
    };
    documents: Array<{
      type: string;
      name: string;
      fileUrl: string;
      uploadedAt: string;
      verificationStatus?: 'pending' | 'verified' | 'rejected';
      rejectionReason?: string;
    }>;
    capabilities: {
      categories: string[];
      skills: string[];
      certifications: Array<{
        name: string;
        issuedBy: string;
        validFrom: string;
        validTo: string;
        certificateUrl?: string;
      }>;
      productionCapacity?: {
        description: string;
        monthlyCapacity?: number;
        unit?: string;
      };
      qualityStandards: string[];
      locations: string[];
    };
  }>(),
  status: varchar("status", { length: 50 }).default('draft'), // draft, submitted, under_review, approved, rejected, revision_required
  completionPercentage: integer("completion_percentage").default(0),
  submittedAt: timestamp("submitted_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewComments: text("review_comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor verification results
export const vendorVerifications = pgTable("vendor_verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  vendorId: varchar("vendor_id").references(() => users.id).notNull(),
  onboardingFormId: uuid("onboarding_form_id").references(() => vendorOnboardingForms.id),
  verificationType: varchar("verification_type", { length: 100 }).notNull(), // tax_id, vat_number, msme, bank_account, etc.
  verificationData: jsonb("verification_data").$type<{
    inputValue: string;
    apiResponse?: any;
    verificationStatus: 'pending' | 'verified' | 'failed' | 'manual_review';
    verifiedData?: any;
    discrepancies?: string[];
    riskScore?: number;
    lastChecked: string;
  }>(),
  status: varchar("status", { length: 50 }).notNull(), // pending, verified, failed, manual_review
  riskScore: decimal("risk_score", { precision: 5, scale: 2 }),
  verificationSource: varchar("verification_source", { length: 100 }), // govt_api, third_party, manual
  verifiedAt: timestamp("verified_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email templates for vendor invitations
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("body_html").notNull(),
  bodyText: text("body_text"),
  templateType: varchar("template_type", { length: 100 }).notNull(), // vendor_invitation, reminder, welcome, etc.
  variables: jsonb("variables").$type<Array<{
    key: string;
    description: string;
    required: boolean;
  }>>(),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reminder settings for vendor invitations
export const reminderSettings = pgTable("reminder_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  reminderType: varchar("reminder_type", { length: 100 }).notNull(), // vendor_invitation, onboarding_incomplete, etc.
  scheduleConfig: jsonb("schedule_config").$type<{
    intervals: Array<{ days: number; description: string }>; // e.g., [{ days: 3, description: "3 days after invite" }]
    maxReminders: number;
    escalationRules?: Array<{
      afterReminder: number;
      escalateTo: string; // user ID
      emailTemplate?: string;
    }>;
  }>(),
  emailTemplateId: varchar("email_template_id", { length: 255 }).references(() => emailTemplates.id),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor approval workflows
export const vendorApprovalWorkflows = pgTable("vendor_approval_workflows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  vendorId: varchar("vendor_id").references(() => users.id).notNull(),
  onboardingFormId: uuid("onboarding_form_id").references(() => vendorOnboardingForms.id).notNull(),
  workflowSteps: jsonb("workflow_steps").$type<Array<{
    step: number;
    name: string;
    assignedTo: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    completedAt?: string;
    completedBy?: string;
  }>>(),
  currentStep: integer("current_step").default(1),
  finalStatus: varchar("final_status", { length: 50 }).default('pending'), // pending, approved, rejected
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }),
  scoreBreakdown: jsonb("score_breakdown").$type<{
    compliance: number;
    financial: number;
    operational: number;
    reputation: number;
    documentation: number;
  }>(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export const insertVendorInvitationSchema = createInsertSchema(vendorInvitations);
export const insertVendorOnboardingFormSchema = createInsertSchema(vendorOnboardingForms);
export const insertVendorVerificationSchema = createInsertSchema(vendorVerifications);
export const insertVendorApprovalWorkflowSchema = createInsertSchema(vendorApprovalWorkflows);

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
export type VendorInvitation = typeof vendorInvitations.$inferSelect;
export type VendorOnboardingForm = typeof vendorOnboardingForms.$inferSelect;
export type VendorVerification = typeof vendorVerifications.$inferSelect;
export type VendorApprovalWorkflow = typeof vendorApprovalWorkflows.$inferSelect;

export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertTenantUser = z.infer<typeof insertTenantUserSchema>;
export type InsertSupplierProfile = z.infer<typeof insertSupplierProfileSchema>;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type InsertVendorInvitation = z.infer<typeof insertVendorInvitationSchema>;
export type InsertVendorOnboardingForm = z.infer<typeof insertVendorOnboardingFormSchema>;
export type InsertVendorVerification = z.infer<typeof insertVendorVerificationSchema>;
export type InsertVendorApprovalWorkflow = z.infer<typeof insertVendorApprovalWorkflowSchema>;
