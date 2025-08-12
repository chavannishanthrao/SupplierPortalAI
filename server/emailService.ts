import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

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

// Default configuration for common SMTP providers
const getDefaultSMTPConfig = (): EmailConfig => {
  // You can configure these via environment variables
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'your-email@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    }
  };
};

let transporter: Transporter | null = null;

const initializeEmailService = () => {
  if (!transporter) {
    const config = getDefaultSMTPConfig();
    transporter = nodemailer.createTransport(config);
  }
  return transporter;
};

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const emailTransporter = initializeEmailService();
    
    const mailOptions = {
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
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