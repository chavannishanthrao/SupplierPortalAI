import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { storage } from './storage';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

// Get SMTP configuration from database or environment variables
const getSMTPConfig = async (tenantId: string = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6'): Promise<EmailConfig | null> => {
  try {
    // Try to get SMTP settings from database first
    const [host, port, user, password, secure] = await Promise.all([
      storage.getAdminSetting(tenantId, 'smtp_host'),
      storage.getAdminSetting(tenantId, 'smtp_port'),
      storage.getAdminSetting(tenantId, 'smtp_user'),
      storage.getAdminSetting(tenantId, 'smtp_password'),
      storage.getAdminSetting(tenantId, 'smtp_secure'),
    ]);

    if (user?.settingValue && password?.settingValue && host?.settingValue) {
      return {
        host: host.settingValue,
        port: parseInt(port?.settingValue || '587'),
        secure: secure?.settingValue === 'true',
        auth: {
          user: user.settingValue,
          pass: password.settingValue
        }
      };
    }
  } catch (error) {
    console.error('Error fetching SMTP settings from database:', error);
  }

  // Fall back to environment variables
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };
  }

  return null;
};

const createEmailTransporter = async (config: EmailConfig): Promise<Transporter> => {
  return nodemailer.createTransporter(config);
};

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export async function sendEmail(params: EmailParams & { tenantId?: string }): Promise<EmailResult> {
  const timestamp = new Date();
  
  try {
    // Get SMTP configuration from database or environment variables
    const config = await getSMTPConfig(params.tenantId);
    
    if (!config) {
      return {
        success: false,
        error: 'SMTP credentials not configured. Please configure in Admin settings.',
        timestamp
      };
    }

    const emailTransporter = await createEmailTransporter(config);
    
    const mailOptions = {
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${params.to}`, info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      timestamp
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown email error';
    return {
      success: false,
      error: errorMessage,
      timestamp
    };
  }
}

// Template for vendor invitation email
export function generateVendorInvitationEmail(
  supplierName: string,
  inviteLink: string,
  requestorName: string,
  companyName: string,
  customMessage?: string
): { subject: string; html: string; text: string } {
  const subject = `Supplier Portal Invitation from ${companyName}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Supplier Portal Invitation</h1>
        </div>
        <div class="content">
          <h2>Hello ${supplierName},</h2>
          <p>You have been invited by ${requestorName} from ${companyName} to join our supplier portal.</p>
          ${customMessage ? `<p><strong>Message:</strong> ${customMessage}</p>` : ''}
          <p>Our supplier portal will allow you to:</p>
          <ul>
            <li>Manage purchase orders and invoices</li>
            <li>Upload and share documents</li>
            <li>Communicate directly with our team</li>
            <li>Track order status and delivery schedules</li>
          </ul>
          <p>To get started, please click the button below:</p>
          <a href="${inviteLink}" class="button">Accept Invitation</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${inviteLink}</p>
          <p>This invitation will expire in 30 days. If you have any questions, please contact ${requestorName}.</p>
        </div>
        <div class="footer">
          <p>This email was sent by ${companyName} Supplier Portal</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Supplier Portal Invitation from ${companyName}
    
    Hello ${supplierName},
    
    You have been invited by ${requestorName} from ${companyName} to join our supplier portal.
    
    ${customMessage ? `Message: ${customMessage}\n\n` : ''}
    
    Our supplier portal will allow you to:
    - Manage purchase orders and invoices
    - Upload and share documents  
    - Communicate directly with our team
    - Track order status and delivery schedules
    
    To get started, please visit: ${inviteLink}
    
    This invitation will expire in 30 days. If you have any questions, please contact ${requestorName}.
    
    --
    ${companyName} Supplier Portal
  `;

  return { subject, html, text };
}