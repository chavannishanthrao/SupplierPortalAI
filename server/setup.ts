import { storage } from "./storage";

export async function initializeDatabase() {
  try {
    // Check if default tenant exists
    const defaultTenantId = 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6';
    let tenant;
    
    try {
      tenant = await storage.getTenant(defaultTenantId);
    } catch (error) {
      tenant = null;
    }
    
    if (!tenant) {
      // Tenant doesn't exist, create it
      tenant = await storage.createTenant({
        id: defaultTenantId,
        name: 'Default Organization',
        domain: 'default.local',
        settings: {
          companyType: 'manufacturing',
          industry: 'General',
          preferences: {}
        },
        isActive: true,
      });
      console.log('✓ Created default tenant:', tenant.name);
    }
    
    if (tenant) {
      console.log('✓ Default tenant exists:', tenant.name);
    }
    
    return { success: true, tenant };
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return { success: false, error };
  }
}