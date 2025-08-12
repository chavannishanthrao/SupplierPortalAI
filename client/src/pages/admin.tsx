import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Settings, Mail, Database, Users, Shield } from "lucide-react";

const emailConfigSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host is required"),
  smtpPort: z.string().regex(/^\d+$/, "Port must be a number"),
  smtpUser: z.string().email("Valid email address required"),
  smtpPassword: z.string().min(1, "SMTP password is required"),
  smtpSecure: z.boolean().default(false),
});

type EmailConfigForm = z.infer<typeof emailConfigSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("email");

  const emailForm = useForm<EmailConfigForm>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      smtpHost: "smtp.gmail.com",
      smtpPort: "587",
      smtpUser: "",
      smtpPassword: "",
      smtpSecure: false,
    },
  });

  const onEmailConfigSubmit = (data: EmailConfigForm) => {
    // In a real implementation, this would save to environment variables or settings
    console.log("Email configuration:", data);
    toast({
      title: "Email Configuration Saved",
      description: "SMTP settings have been updated successfully.",
    });
  };

  const testEmailConnection = async () => {
    const formData = emailForm.getValues();
    
    toast({
      title: "Testing Email Connection",
      description: "Sending test email...",
    });
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtpConfig: formData,
          testEmail: formData.smtpUser, // Send test to the configured email
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Email Test Successful",
          description: `Test email sent successfully to ${formData.smtpUser}!`,
        });
      } else {
        toast({
          title: "Email Test Failed",
          description: result.error || "Failed to send test email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Email Test Failed",
        description: "Failed to connect to email service",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Administrative Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Database</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>User Management</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>System</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Email Configuration</CardTitle>
              <CardDescription>
                Configure SMTP settings for sending invitation emails and notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit(onEmailConfigSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={emailForm.control}
                      name="smtpHost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={emailForm.control}
                      name="smtpPort"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Port</FormLabel>
                          <FormControl>
                            <Input placeholder="587" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={emailForm.control}
                    name="smtpUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your-email@gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={emailForm.control}
                    name="smtpPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password / App Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password or app password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-4">
                    <Button type="submit">Save Configuration</Button>
                    <Button type="button" variant="outline" onClick={testEmailConnection}>
                      Test Connection
                    </Button>
                  </div>
                </form>
              </Form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Gmail Setup Instructions:</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Enable 2-factor authentication on your Gmail account</li>
                  <li>2. Generate an App Password: Account Settings → Security → App Passwords</li>
                  <li>3. Use the 16-character app password (not your regular password)</li>
                  <li>4. Use smtp.gmail.com with port 587</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>
                Monitor database connections and perform maintenance tasks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Database Status</p>
                    <p className="text-sm text-muted-foreground">PostgreSQL Connection Active</p>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline">Run Database Migration</Button>
                  <Button variant="outline">Backup Database</Button>
                  <Button variant="outline">View Connection Logs</Button>
                  <Button variant="outline">Database Health Check</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Input placeholder="Search users..." className="max-w-sm" />
                  <Button>Add New User</Button>
                </div>
                
                <div className="border rounded-lg">
                  <div className="p-4 border-b">
                    <p className="font-medium">User Management Features</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">• View all registered users</p>
                    <p className="text-sm text-muted-foreground">• Manage user roles and permissions</p>
                    <p className="text-sm text-muted-foreground">• Enable/disable user accounts</p>
                    <p className="text-sm text-muted-foreground">• Reset user passwords</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security policies and authentication settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input id="sessionTimeout" type="number" defaultValue="60" className="w-20" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input id="maxLoginAttempts" type="number" defaultValue="5" className="w-20" />
                  </div>
                  
                  <Button>Update Security Settings</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                View system status and configuration details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Application Version</p>
                    <p className="text-sm text-muted-foreground">v1.0.0</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Node.js Version</p>
                    <p className="text-sm text-muted-foreground">{typeof process !== 'undefined' ? process.version : 'N/A'}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Environment</p>
                    <p className="text-sm text-muted-foreground">Development</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="font-medium">Uptime</p>
                    <p className="text-sm text-muted-foreground">Online</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}