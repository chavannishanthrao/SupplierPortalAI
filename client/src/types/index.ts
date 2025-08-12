export type CompanyType = 'manufacturing' | 'service';

export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: string;
  companyName: string | null;
  companyType: CompanyType | null;
  isActive: boolean;
}

export interface AuthUser extends User {
  tenantUser?: TenantUser;
}

export interface DashboardMetrics {
  activeOrders: number;
  pendingInvoices: number;
  onTimeDelivery: number;
  qualityScore: number;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  sku?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  uploadedAt?: string;
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string;
  orderNumber: string;
  orderType: 'purchase_order' | 'work_order';
  title: string;
  description: string | null;
  amount: string;
  currency: string;
  status: string;
  dueDate: string | null;
  deliveryDate: string | null;
  lineItems: LineItem[] | null;
  attachments: Attachment[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  supplierId: string;
  purchaseOrderId: string | null;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  paidDate: string | null;
  taxAmount: string | null;
  discountAmount: string | null;
  lineItems: LineItem[] | null;
  attachments: Attachment[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  tenantId: string;
  userId: string;
  filename: string;
  originalName: string;
  fileType: string | null;
  fileSize: number | null;
  category: string | null;
  tags: string[] | null;
  url: string | null;
  isPublic: boolean;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  tenantId: string;
  senderId: string;
  recipientId: string | null;
  subject: string | null;
  content: string;
  messageType: string;
  priority: string;
  isRead: boolean;
  attachments: Attachment[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProfile {
  id: string;
  tenantId: string;
  userId: string;
  companyName: string;
  companyType: CompanyType;
  businessLicense: string | null;
  taxId: string | null;
  bankDetails: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    isVerified: boolean;
  } | null;
  contactInfo: {
    phone: string;
    address: string;
    website?: string;
  } | null;
  capabilities: {
    skills?: string[];
    productionCapacity?: number;
    certifications?: string[];
    locations?: string[];
  } | null;
  onboardingStatus: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}
