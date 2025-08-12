import {
  users,
  tenants,
  tenantUsers,
  supplierProfiles,
  purchaseOrders,
  invoices,
  documents,
  messages,
  performanceMetrics,
  vendorInvitations,
  vendorOnboardingForms,
  vendorVerifications,
  vendorApprovalWorkflows,
  type User,
  type UpsertUser,
  type Tenant,
  type TenantUser,
  type SupplierProfile,
  type PurchaseOrder,
  type Invoice,
  type Document,
  type Message,
  type PerformanceMetric,
  type VendorInvitation,
  type VendorOnboardingForm,
  type VendorVerification,
  type VendorApprovalWorkflow,
  type InsertTenant,
  type InsertTenantUser,
  type InsertSupplierProfile,
  type InsertPurchaseOrder,
  type InsertInvoice,
  type InsertDocument,
  type InsertMessage,
  type InsertPerformanceMetric,
  type InsertVendorInvitation,
  type InsertVendorOnboardingForm,
  type InsertVendorVerification,
  type InsertVendorApprovalWorkflow,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Tenant operations
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  getTenant(id: string): Promise<Tenant | undefined>;
  getTenantByDomain(domain: string): Promise<Tenant | undefined>;

  // Tenant user operations
  createTenantUser(tenantUser: InsertTenantUser): Promise<TenantUser>;
  getTenantUser(tenantId: string, userId: string): Promise<TenantUser | undefined>;
  getTenantUsers(tenantId: string): Promise<TenantUser[]>;

  // Supplier profile operations
  createSupplierProfile(profile: InsertSupplierProfile): Promise<SupplierProfile>;
  getSupplierProfile(tenantId: string, userId: string): Promise<SupplierProfile | undefined>;
  updateSupplierProfile(id: string, updates: Partial<SupplierProfile>): Promise<SupplierProfile>;
  getSupplierProfiles(tenantId: string): Promise<SupplierProfile[]>;

  // Purchase order operations
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  getPurchaseOrder(id: string, tenantId: string): Promise<PurchaseOrder | undefined>;
  getPurchaseOrders(tenantId: string, supplierId?: string): Promise<PurchaseOrder[]>;
  updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder>;

  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: string, tenantId: string): Promise<Invoice | undefined>;
  getInvoices(tenantId: string, supplierId?: string): Promise<Invoice[]>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string, tenantId: string): Promise<Document | undefined>;
  getDocuments(tenantId: string, userId?: string): Promise<Document[]>;
  deleteDocument(id: string, tenantId: string): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(tenantId: string, userId: string): Promise<Message[]>;
  markMessageAsRead(id: string, userId: string): Promise<void>;
  getUnreadMessageCount(tenantId: string, userId: string): Promise<number>;

  // Performance metrics operations
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;
  getPerformanceMetrics(tenantId: string, supplierId?: string): Promise<PerformanceMetric[]>;

  // Dashboard data
  getDashboardMetrics(tenantId: string, supplierId: string): Promise<{
    activeOrders: number;
    pendingInvoices: number;
    onTimeDelivery: number;
    qualityScore: number;
  }>;

  // Vendor invitations
  getVendorInvitations(tenantId: string): Promise<VendorInvitation[]>;
  createVendorInvitation(invitation: InsertVendorInvitation): Promise<VendorInvitation>;
  getVendorInvitationByToken(token: string): Promise<VendorInvitation | undefined>;
  updateVendorInvitation(id: string, updates: Partial<VendorInvitation>): Promise<VendorInvitation>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Tenant operations
  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [result] = await db.insert(tenants).values([tenant]).returning();
    return result;
  }

  async getTenant(id: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.domain, domain));
    return tenant;
  }

  // Tenant user operations
  async createTenantUser(tenantUser: InsertTenantUser): Promise<TenantUser> {
    const [result] = await db.insert(tenantUsers).values([tenantUser]).returning();
    return result;
  }

  async getTenantUser(tenantId: string, userId: string): Promise<TenantUser | undefined> {
    const [tenantUser] = await db
      .select()
      .from(tenantUsers)
      .where(and(eq(tenantUsers.tenantId, tenantId), eq(tenantUsers.userId, userId)));
    return tenantUser;
  }

  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    return await db.select().from(tenantUsers).where(eq(tenantUsers.tenantId, tenantId));
  }

  // Supplier profile operations
  async createSupplierProfile(profile: InsertSupplierProfile): Promise<SupplierProfile> {
    const [result] = await db.insert(supplierProfiles).values([profile]).returning();
    return result;
  }

  async getSupplierProfile(tenantId: string, userId: string): Promise<SupplierProfile | undefined> {
    const [profile] = await db
      .select()
      .from(supplierProfiles)
      .where(and(eq(supplierProfiles.tenantId, tenantId), eq(supplierProfiles.userId, userId)));
    return profile;
  }

  async updateSupplierProfile(id: string, updates: Partial<SupplierProfile>): Promise<SupplierProfile> {
    const [result] = await db
      .update(supplierProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supplierProfiles.id, id))
      .returning();
    return result;
  }

  async getSupplierProfiles(tenantId: string): Promise<SupplierProfile[]> {
    return await db.select().from(supplierProfiles).where(eq(supplierProfiles.tenantId, tenantId));
  }

  // Purchase order operations
  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const [result] = await db.insert(purchaseOrders).values([order]).returning();
    return result;
  }

  async getPurchaseOrder(id: string, tenantId: string): Promise<PurchaseOrder | undefined> {
    const [order] = await db
      .select()
      .from(purchaseOrders)
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.tenantId, tenantId)));
    return order;
  }

  async getPurchaseOrders(tenantId: string, supplierId?: string): Promise<PurchaseOrder[]> {
    const conditions = [eq(purchaseOrders.tenantId, tenantId)];
    if (supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, supplierId));
    }
    return await db
      .select()
      .from(purchaseOrders)
      .where(and(...conditions))
      .orderBy(desc(purchaseOrders.createdAt));
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const [result] = await db
      .update(purchaseOrders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return result;
  }

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [result] = await db.insert(invoices).values([invoice]).returning();
    return result;
  }

  async getInvoice(id: string, tenantId: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.tenantId, tenantId)));
    return invoice;
  }

  async getInvoices(tenantId: string, supplierId?: string): Promise<Invoice[]> {
    const conditions = [eq(invoices.tenantId, tenantId)];
    if (supplierId) {
      conditions.push(eq(invoices.supplierId, supplierId));
    }
    return await db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .orderBy(desc(invoices.createdAt));
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const [result] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return result;
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [result] = await db.insert(documents).values([document]).returning();
    return result;
  }

  async getDocument(id: string, tenantId: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)));
    return document;
  }

  async getDocuments(tenantId: string, userId?: string): Promise<Document[]> {
    const conditions = [eq(documents.tenantId, tenantId)];
    if (userId) {
      conditions.push(eq(documents.userId, userId));
    }
    return await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.createdAt));
  }

  async deleteDocument(id: string, tenantId: string): Promise<void> {
    await db.delete(documents).where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values([message]).returning();
    return result;
  }

  async getMessages(tenantId: string, userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.tenantId, tenantId),
          sql`(${messages.senderId} = ${userId} OR ${messages.recipientId} = ${userId})`
        )
      )
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(messages.id, id), eq(messages.recipientId, userId)));
  }

  async getUnreadMessageCount(tenantId: string, userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(
        and(
          eq(messages.tenantId, tenantId),
          eq(messages.recipientId, userId),
          eq(messages.isRead, false)
        )
      );
    return result.count;
  }

  // Performance metrics operations
  async createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const [result] = await db.insert(performanceMetrics).values(metric).returning();
    return result;
  }

  async getPerformanceMetrics(tenantId: string, supplierId?: string): Promise<PerformanceMetric[]> {
    const conditions = [eq(performanceMetrics.tenantId, tenantId)];
    if (supplierId) {
      conditions.push(eq(performanceMetrics.supplierId, supplierId));
    }
    return await db
      .select()
      .from(performanceMetrics)
      .where(and(...conditions))
      .orderBy(desc(performanceMetrics.recordedAt));
  }

  // Dashboard data
  async getDashboardMetrics(tenantId: string, supplierId: string): Promise<{
    activeOrders: number;
    pendingInvoices: number;
    onTimeDelivery: number;
    qualityScore: number;
  }> {
    const [activeOrdersResult] = await db
      .select({ count: count() })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.tenantId, tenantId),
          eq(purchaseOrders.supplierId, supplierId),
          sql`${purchaseOrders.status} IN ('acknowledged', 'in_progress')`
        )
      );

    const [pendingInvoicesResult] = await db
      .select({ count: count() })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, tenantId),
          eq(invoices.supplierId, supplierId),
          sql`${invoices.status} IN ('draft', 'submitted', 'under_review')`
        )
      );

    // Get recent performance metrics
    const metrics = await db
      .select()
      .from(performanceMetrics)
      .where(
        and(
          eq(performanceMetrics.tenantId, tenantId),
          eq(performanceMetrics.supplierId, supplierId),
          sql`${performanceMetrics.recordedAt} >= NOW() - INTERVAL '30 days'`
        )
      );

    const onTimeDeliveryMetrics = metrics.filter(m => m.metricType === 'on_time_delivery');
    const qualityMetrics = metrics.filter(m => m.metricType === 'quality_score');

    const onTimeDelivery = onTimeDeliveryMetrics.length > 0 
      ? onTimeDeliveryMetrics.reduce((sum, m) => sum + Number(m.value), 0) / onTimeDeliveryMetrics.length
      : 0;

    const qualityScore = qualityMetrics.length > 0
      ? qualityMetrics.reduce((sum, m) => sum + Number(m.value), 0) / qualityMetrics.length
      : 0;

    return {
      activeOrders: activeOrdersResult.count,
      pendingInvoices: pendingInvoicesResult.count,
      onTimeDelivery: Math.round(onTimeDelivery * 100) / 100,
      qualityScore: Math.round(qualityScore * 100) / 100,
    };
  }

  // Vendor invitation operations
  async getVendorInvitations(tenantId: string): Promise<VendorInvitation[]> {
    const results = await db
      .select()
      .from(vendorInvitations)
      .where(eq(vendorInvitations.tenantId, tenantId))
      .orderBy(desc(vendorInvitations.createdAt));
    return results;
  }

  async createVendorInvitation(invitation: InsertVendorInvitation): Promise<VendorInvitation> {
    const [result] = await db.insert(vendorInvitations).values([invitation]).returning();
    return result;
  }

  async getVendorInvitationByToken(token: string): Promise<VendorInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(vendorInvitations)
      .where(eq(vendorInvitations.inviteToken, token));
    return invitation;
  }

  async updateVendorInvitation(id: string, updates: Partial<VendorInvitation>): Promise<VendorInvitation> {
    const [result] = await db
      .update(vendorInvitations)
      .set(updates)
      .where(eq(vendorInvitations.id, id))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
