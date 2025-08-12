import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertTenantSchema,
  insertTenantUserSchema,
  insertSupplierProfileSchema,
  insertPurchaseOrderSchema,
  insertInvoiceSchema,
  insertDocumentSchema,
  insertMessageSchema,
} from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get tenant information
      const tenantUsers = await storage.getTenantUsers('default-tenant'); // For now, use default tenant
      const tenantUser = tenantUsers.find(tu => tu.userId === userId);

      res.json({
        ...user,
        tenantUser,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Tenant routes
  app.get('/api/tenants/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const tenant = await storage.getTenant(id);
      
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      res.json(tenant);
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  // Supplier profile routes
  app.get('/api/supplier-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant'; // For now, use default tenant
      
      const profile = await storage.getSupplierProfile(tenantId, userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Supplier profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching supplier profile:", error);
      res.status(500).json({ message: "Failed to fetch supplier profile" });
    }
  });

  app.post('/api/supplier-profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const profileData = insertSupplierProfileSchema.parse({
        ...req.body,
        tenantId,
        userId,
      });

      const profile = await storage.createSupplierProfile(profileData);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating supplier profile:", error);
      res.status(500).json({ message: "Failed to create supplier profile" });
    }
  });

  app.put('/api/supplier-profile/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const profile = await storage.updateSupplierProfile(id, updates);
      res.json(profile);
    } catch (error) {
      console.error("Error updating supplier profile:", error);
      res.status(500).json({ message: "Failed to update supplier profile" });
    }
  });

  // Purchase order routes
  app.get('/api/purchase-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const orders = await storage.getPurchaseOrders(tenantId, userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.get('/api/purchase-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const tenantId = 'default-tenant';
      
      const order = await storage.getPurchaseOrder(id, tenantId);
      
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  app.post('/api/purchase-orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const orderData = insertPurchaseOrderSchema.parse({
        ...req.body,
        tenantId,
        supplierId: userId,
      });

      const order = await storage.createPurchaseOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating purchase order:", error);
      res.status(500).json({ message: "Failed to create purchase order" });
    }
  });

  app.put('/api/purchase-orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const order = await storage.updatePurchaseOrder(id, updates);
      res.json(order);
    } catch (error) {
      console.error("Error updating purchase order:", error);
      res.status(500).json({ message: "Failed to update purchase order" });
    }
  });

  // Invoice routes
  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const invoices = await storage.getInvoices(tenantId, userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const tenantId = 'default-tenant';
      
      const invoice = await storage.getInvoice(id, tenantId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const invoiceData = insertInvoiceSchema.parse({
        ...req.body,
        tenantId,
        supplierId: userId,
      });

      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const invoice = await storage.updateInvoice(id, updates);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Document routes
  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const documents = await storage.getDocuments(tenantId, userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/documents/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { category, tags } = req.body;
      
      const documentData = insertDocumentSchema.parse({
        tenantId,
        userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        category: category || 'general',
        tags: tags ? JSON.parse(tags) : [],
        url: `/uploads/${req.file.filename}`,
      });

      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const tenantId = 'default-tenant';
      
      await storage.deleteDocument(id, tenantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const messages = await storage.getMessages(tenantId, userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        tenantId,
        senderId: userId,
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.put('/api/messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      await storage.markMessageAsRead(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.get('/api/messages/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const count = await storage.getUnreadMessageCount(tenantId, userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread message count:", error);
      res.status(500).json({ message: "Failed to fetch unread message count" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const metrics = await storage.getDashboardMetrics(tenantId, userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Performance metrics routes
  app.get('/api/performance-metrics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tenantId = 'default-tenant';
      
      const metrics = await storage.getPerformanceMetrics(tenantId, userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Add basic security check here
    next();
  });

  const httpServer = createServer(app);
  return httpServer;
}
