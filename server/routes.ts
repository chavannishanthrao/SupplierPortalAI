import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { isAnyAuthenticated, createLocalUser } from "./localAuth";
import { z } from "zod";
import passport from "passport";
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

  // Local auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user
      const user = await createLocalUser(email, password, firstName, lastName);
      
      // Create tenant user relationship
      await storage.createTenantUser({
        tenantId: 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6',
        userId: user.id,
        role: 'supplier',
        companyName: null,
        companyType: null,
      });

      res.json({ message: "User created successfully", user: { id: user.id, email: user.email } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }
        res.json({ message: "Login successful", user: { id: user.id, email: user.email } });
      });
    })(req, res, next);
  });

  // Auth routes (works for both local and Replit auth)
  app.get('/api/auth/user', isAnyAuthenticated, async (req: any, res) => {
    try {
      // Handle both local and Replit auth
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get tenant information
      const tenantUsers = await storage.getTenantUsers('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6'); // Default tenant UUID
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6'; // Default tenant UUID
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
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
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      
      const metrics = await storage.getPerformanceMetrics(tenantId, userId);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ message: "Failed to fetch performance metrics" });
    }
  });

  // Support data endpoints for vendor onboarding
  app.get('/api/entities', isAnyAuthenticated, async (req: any, res) => {
    try {
      // Mock entities for now - in a real implementation this would come from a database
      const entities = [
        { id: 'entity-1', name: 'Manufacturing Division', code: 'MFG' },
        { id: 'entity-2', name: 'Services Division', code: 'SVC' },
        { id: 'entity-3', name: 'Technology Division', code: 'TECH' },
      ];
      res.json(entities);
    } catch (error) {
      console.error("Error fetching entities:", error);
      res.status(500).json({ message: "Failed to fetch entities" });
    }
  });

  app.get('/api/users', isAnyAuthenticated, async (req: any, res) => {
    try {
      // Mock users for requestor dropdown - in real implementation would filter active users
      const users = [
        { id: 'user-1', name: 'John Smith', email: 'john.smith@company.com', role: 'Procurement Manager' },
        { id: 'user-2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Vendor Manager' },
        { id: 'user-3', name: 'Mike Davis', email: 'mike.davis@company.com', role: 'Director of Operations' },
      ];
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/email-templates', isAnyAuthenticated, async (req: any, res) => {
    try {
      // Mock email templates - in real implementation from database
      const templates = [
        { id: 'template-1', name: 'Standard Vendor Invitation', subject: 'Invitation to Partner with {{companyName}}' },
        { id: 'template-2', name: 'Premium Vendor Invitation', subject: 'Exclusive Partnership Opportunity with {{companyName}}' },
        { id: 'template-3', name: 'Quick Onboarding Template', subject: 'Fast-Track Vendor Registration' },
      ];
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  // Vendor onboarding API routes
  
  // Vendor invitations
  app.get('/api/vendor-invitations', isAnyAuthenticated, async (req: any, res) => {
    try {
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6'; // Default tenant UUID
      // For now, return empty array - we'll implement storage later
      res.json([]);
    } catch (error) {
      console.error("Error fetching vendor invitations:", error);
      res.status(500).json({ message: "Failed to fetch vendor invitations" });
    }
  });

  app.post('/api/vendor-invitations', isAnyAuthenticated, async (req: any, res) => {
    try {
      const { email, firstName, lastName, companyName, customMessage } = req.body;
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6'; // Default tenant UUID
      const userId = req.user.claims?.sub || req.user.id;
      
      // Generate invite token
      const inviteToken = Date.now().toString(36) + Math.random().toString(36).substr(2);
      
      // Create invitation record (mock for now)
      const invitation = {
        id: Date.now().toString(),
        tenantId,
        email,
        firstName,
        lastName,
        companyName,
        inviteToken,
        status: 'pending',
        invitedBy: userId,
        customMessage,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
      };
      
      // In a real implementation, we would:
      // 1. Save to database
      // 2. Send email invitation
      // 3. Set up tracking
      
      res.json({ message: "Invitation sent successfully", invitation });
    } catch (error) {
      console.error("Error sending vendor invitation:", error);
      res.status(500).json({ message: "Failed to send vendor invitation" });
    }
  });

  // Vendor onboarding forms
  app.get('/api/vendor-onboarding-forms', isAnyAuthenticated, async (req: any, res) => {
    try {
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6'; // Default tenant UUID
      // For now, return empty array - we'll implement storage later
      res.json([]);
    } catch (error) {
      console.error("Error fetching vendor onboarding forms:", error);
      res.status(500).json({ message: "Failed to fetch vendor onboarding forms" });
    }
  });

  // Vendor approval workflows
  app.get('/api/vendor-approval-workflows', isAnyAuthenticated, async (req: any, res) => {
    try {
      const tenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6'; // Default tenant UUID
      // For now, return empty array - we'll implement storage later
      res.json([]);
    } catch (error) {
      console.error("Error fetching vendor approval workflows:", error);
      res.status(500).json({ message: "Failed to fetch vendor approval workflows" });
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
