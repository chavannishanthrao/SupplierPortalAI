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
import { nanoid } from "nanoid";
import { sendEmail, generateVendorInvitationEmail } from "./emailService";

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
    console.log('Login attempt for:', req.body.email);
    passport.authenticate('local', (err: any, user: any, info: any) => {
      console.log('Auth result - err:', err, 'user:', user, 'info:', info);
      if (err) {
        console.error('Authentication error:', err);
        return res.status(500).json({ message: "Authentication error: " + (err.message || err) });
      }
      if (!user) {
        console.log('No user found, info:', info);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error('Login error:', err);
          return res.status(500).json({ message: "Login error: " + (err.message || err) });
        }
        console.log('Login successful for user:', user.id);
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
      const tenantId = req.user?.tenantId || 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
      const invitations = await storage.getVendorInvitations(tenantId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching vendor invitations:", error);
      res.status(500).json({ message: "Failed to fetch vendor invitations" });
    }
  });

  app.post('/api/vendor-invitations', isAnyAuthenticated, async (req: any, res) => {
    try {
      const currentUser = req.user;
      const supplierEmail = req.body.primaryContactEmail;
      const tempPassword = nanoid(12);
      const inviteToken = nanoid();
      
      const now = new Date();
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const invitationData = {
        tenantId: currentUser?.tenantId || 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6',
        entityId: req.body.entityId,
        supplierName: req.body.supplierName,
        requestorId: currentUser?.id || 'demo-user-12345',
        responseDueDate: req.body.responseDueDate ? new Date(req.body.responseDueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        supplierCategory: req.body.supplierCategory,
        defaultPaymentTerms: req.body.defaultPaymentTerms,
        primaryContactFirstName: req.body.primaryContactFirstName,
        primaryContactLastName: req.body.primaryContactLastName,
        primaryContactPhone: req.body.primaryContactPhone || '',
        primaryContactEmail: supplierEmail,
        secondaryContactFirstName: req.body.secondaryContactFirstName || '',
        secondaryContactLastName: req.body.secondaryContactLastName || '',
        secondaryContactPhone: req.body.secondaryContactPhone || '',
        secondaryContactEmail: req.body.secondaryContactEmail || '',
        emailTemplateId: req.body.emailTemplateId || null,
        customMessage: req.body.customMessage || '',
        attachedDocuments: req.body.attachedDocuments || [],
        supplierEmail,
        tempPassword,
        inviteToken,
        invitedBy: currentUser?.id || 'demo-user-12345',
        status: 'pending' as const,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      // Save invitation to database
      const savedInvitation = await storage.createVendorInvitation(invitationData);
      
      // Generate invitation link
      const baseUrl = req.protocol + '://' + req.get('host');
      const inviteLink = `${baseUrl}/vendor-invite?token=${inviteToken}&email=${encodeURIComponent(supplierEmail)}`;
      
      // Generate and send email
      const requestorName = currentUser?.firstName && currentUser?.lastName ? 
        `${currentUser.firstName} ${currentUser.lastName}` : 
        currentUser?.email || 'Team Member';
      const companyName = currentUser?.tenantUser?.companyName || 'Our Company';
      
      const { subject, html, text } = generateVendorInvitationEmail(
        req.body.supplierName,
        inviteLink,
        requestorName,
        companyName,
        req.body.customMessage
      );

      // Attempt to send email
      const emailResult = await sendEmail({
        to: supplierEmail,
        from: process.env.SMTP_USER || 'noreply@company.com',
        subject,
        html,
        text
      });

      // Update invitation with email status
      const emailStatus = emailResult.success ? 'sent' : 'failed';
      const updateData: any = {
        emailStatus,
        emailAttempts: 1,
        lastEmailAttempt: emailResult.timestamp,
        updatedAt: new Date(),
      };

      if (emailResult.success) {
        updateData.emailSentAt = emailResult.timestamp;
      } else {
        updateData.emailFailureReason = emailResult.error;
      }

      // Update the invitation in database with email status
      await storage.updateVendorInvitation(savedInvitation.id, updateData);

      console.log("Vendor invitation created:", {
        ...invitationData,
        tempPassword: '***hidden***',
        emailResult: { success: emailResult.success, error: emailResult.error }
      });
      
      res.json({ 
        message: emailResult.success ? "Vendor invitation sent successfully via email" : "Vendor invitation created (email failed to send)",
        invitationId: savedInvitation.id,
        supplierEmail: supplierEmail,
        emailSent: emailResult.success,
        emailError: emailResult.error,
        inviteLink: emailResult.success ? undefined : inviteLink // Include link if email failed
      });
    } catch (error) {
      console.error("Error creating vendor invitation:", error);
      res.status(500).json({ message: "Failed to create vendor invitation" });
    }
  });

  // Test email endpoint
  app.post('/api/test-email', isAnyAuthenticated, async (req: any, res) => {
    try {
      const { smtpConfig, testEmail } = req.body;
      
      // Temporarily set SMTP environment variables for test
      const originalSMTPUser = process.env.SMTP_USER;
      const originalSMTPPass = process.env.SMTP_PASS;
      const originalSMTPHost = process.env.SMTP_HOST;
      const originalSMTPPort = process.env.SMTP_PORT;
      const originalSMTPSecure = process.env.SMTP_SECURE;
      
      process.env.SMTP_USER = smtpConfig.smtpUser;
      process.env.SMTP_PASS = smtpConfig.smtpPassword;
      process.env.SMTP_HOST = smtpConfig.smtpHost;
      process.env.SMTP_PORT = smtpConfig.smtpPort;
      process.env.SMTP_SECURE = smtpConfig.smtpSecure ? 'true' : 'false';
      
      const emailResult = await sendEmail({
        to: testEmail,
        from: smtpConfig.smtpUser,
        subject: 'Test Email from Supplier Portal',
        html: `
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p>If you received this email, your SMTP settings are configured properly!</p>
          <hr>
          <p><small>Sent from Supplier Portal Admin Panel</small></p>
        `,
        text: `
          Email Configuration Test
          
          This is a test email to verify your SMTP configuration is working correctly.
          If you received this email, your SMTP settings are configured properly!
          
          Sent from Supplier Portal Admin Panel
        `
      });
      
      // Restore original environment variables
      process.env.SMTP_USER = originalSMTPUser;
      process.env.SMTP_PASS = originalSMTPPass;
      process.env.SMTP_HOST = originalSMTPHost;
      process.env.SMTP_PORT = originalSMTPPort;
      process.env.SMTP_SECURE = originalSMTPSecure;
      
      res.json({
        success: emailResult.success,
        error: emailResult.error,
        messageId: emailResult.messageId
      });
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send test email'
      });
    }
  });

  app.post('/api/vendor-invitations/draft', isAnyAuthenticated, async (req: any, res) => {
    try {
      const draftData = {
        ...req.body,
        tenantId: req.user?.tenantId || 'default-tenant',
        inviteToken: nanoid(),
        invitedBy: req.user?.id || 'demo-user',
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Here you would save draft to database
      console.log("Saving vendor invitation draft:", draftData);
      
      res.json({ 
        message: "Vendor invitation draft saved successfully",
        draftId: draftData.inviteToken 
      });
    } catch (error) {
      console.error("Error saving vendor invitation draft:", error);
      res.status(500).json({ message: "Failed to save vendor invitation draft" });
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
