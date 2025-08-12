import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  Mail, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  FileText,
  Shield,
  Users,
  TrendingUp,
  Send,
  Eye,
  MoreHorizontal
} from "lucide-react";

const inviteVendorSchema = z.object({
  entityId: z.string().optional(),
  supplierName: z.string().min(1, "Supplier name is required"),
  requestorId: z.string().min(1, "Requestor is required"),
  responseDueDate: z.string().min(1, "Response due date is required"),
  supplierCategory: z.string().min(1, "Supplier category is required"),
  defaultPaymentTerms: z.string().min(1, "Payment terms are required"),
  
  // Primary contact
  primaryContactFirstName: z.string().min(1, "Primary contact first name is required"),
  primaryContactLastName: z.string().min(1, "Primary contact last name is required"),
  primaryContactPhone: z.string().optional(),
  primaryContactEmail: z.string().email("Invalid primary contact email"),
  
  // Secondary contact (optional)
  secondaryContactFirstName: z.string().optional(),
  secondaryContactLastName: z.string().optional(),
  secondaryContactPhone: z.string().optional(),
  secondaryContactEmail: z.string().email("Invalid secondary contact email").optional().or(z.literal("")),
  
  emailTemplateId: z.string().optional(),
  customMessage: z.string().optional(),
  attachedDocuments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    originalName: z.string(),
    fileType: z.string(),
    category: z.string(),
    requiresSignature: z.boolean(),
    url: z.string(),
  })).optional(),
});

type InviteVendorForm = z.infer<typeof inviteVendorSchema>;

export default function VendorOnboardingPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Queries for vendor onboarding data
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ["/api/vendor-invitations"],
  });

  const { data: onboardingForms = [], isLoading: formsLoading } = useQuery({
    queryKey: ["/api/vendor-onboarding-forms"],
  });

  const { data: approvalWorkflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/vendor-approval-workflows"],
  });

  // Support data queries
  const { data: entities = [] } = useQuery({
    queryKey: ["/api/entities"],
  });

  const { data: requestors = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ["/api/email-templates"],
  });

  // Form for inviting vendors
  const inviteForm = useForm<InviteVendorForm>({
    resolver: zodResolver(inviteVendorSchema),
    defaultValues: {
      entityId: "",
      supplierName: "",
      requestorId: "",
      responseDueDate: "",
      supplierCategory: "",
      defaultPaymentTerms: "",
      primaryContactFirstName: "",
      primaryContactLastName: "",
      primaryContactPhone: "",
      primaryContactEmail: "",
      secondaryContactFirstName: "",
      secondaryContactLastName: "",
      secondaryContactPhone: "",
      secondaryContactEmail: "",
      emailTemplateId: "",
      customMessage: "",
      attachedDocuments: [],
    },
  });

  // Mutation for sending vendor invitations
  const inviteVendorMutation = useMutation({
    mutationFn: (data: InviteVendorForm) =>
      apiRequest("/api/vendor-invitations", { method: "POST", data }),
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Vendor invitation has been sent successfully!",
      });
      inviteForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/vendor-invitations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const onInviteVendor = (data: InviteVendorForm) => {
    inviteVendorMutation.mutate(data);
  };

  // Dashboard metrics calculation
  const dashboardMetrics = {
    totalInvitations: invitations.length,
    pendingInvitations: invitations.filter((inv: any) => inv.status === 'pending').length,
    activeOnboarding: onboardingForms.filter((form: any) => ['draft', 'submitted', 'under_review'].includes(form.status)).length,
    completedOnboarding: onboardingForms.filter((form: any) => form.status === 'approved').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Vendor Onboarding</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Streamline vendor invitations, data collection, verification, and approvals
          </p>
        </div>
        
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite New Vendor</DialogTitle>
              <DialogDescription>
                Send a personalized invitation to onboard a new vendor to your platform.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...inviteForm}>
              <form onSubmit={inviteForm.handleSubmit(onInviteVendor)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={inviteForm.control}
                      name="entityId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Entity</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select entity" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {entities.map((entity: any) => (
                                <SelectItem key={entity.id} value={entity.id}>
                                  {entity.name} ({entity.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={inviteForm.control}
                      name="supplierName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Supplier Company Ltd." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={inviteForm.control}
                      name="requestorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requestor *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select requestor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {requestors.map((user: any) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} - {user.role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={inviteForm.control}
                      name="responseDueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Response Due Date *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={inviteForm.control}
                      name="supplierCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="services">Services</SelectItem>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="logistics">Logistics</SelectItem>
                              <SelectItem value="consulting">Consulting</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={inviteForm.control}
                      name="defaultPaymentTerms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Payment Terms *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select terms" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="net-15">Net 15 days</SelectItem>
                              <SelectItem value="net-30">Net 30 days</SelectItem>
                              <SelectItem value="net-45">Net 45 days</SelectItem>
                              <SelectItem value="net-60">Net 60 days</SelectItem>
                              <SelectItem value="immediate">Immediate</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Primary Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Primary Contact Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={inviteForm.control}
                      name="primaryContactFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={inviteForm.control}
                      name="primaryContactLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={inviteForm.control}
                      name="primaryContactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@supplier.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={inviteForm.control}
                      name="primaryContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Secondary Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Secondary Contact Details (Optional)</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={inviteForm.control}
                      name="secondaryContactFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={inviteForm.control}
                      name="secondaryContactLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={inviteForm.control}
                      name="secondaryContactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jane.smith@supplier.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={inviteForm.control}
                      name="secondaryContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+1 (555) 987-6543" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Email Template & Message */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Configuration</h3>
                  
                  <FormField
                    control={inviteForm.control}
                    name="emailTemplateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Template</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select email template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {emailTemplates.map((template: any) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={inviteForm.control}
                    name="customMessage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add a personalized message to include in the invitation email..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between gap-3 pt-6">
                  <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline">
                      Save as Draft
                    </Button>
                    <Button type="submit" disabled={inviteVendorMutation.isPending}>
                      {inviteVendorMutation.isPending ? "Sending..." : "Send Invitation"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.totalInvitations}</div>
                <p className="text-xs text-muted-foreground">Vendors invited</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.pendingInvitations}</div>
                <p className="text-xs text-muted-foreground">Awaiting response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Onboarding</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.activeOnboarding}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardMetrics.completedOnboarding}</div>
                <p className="text-xs text-muted-foreground">Approved vendors</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest vendor onboarding activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.slice(0, 5).map((invitation: any) => (
                  <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{invitation.firstName} {invitation.lastName}</p>
                        <p className="text-sm text-muted-foreground">{invitation.companyName}</p>
                      </div>
                    </div>
                    <Badge variant={invitation.status === 'pending' ? 'secondary' : 
                                  invitation.status === 'accepted' ? 'default' : 'destructive'}>
                      {invitation.status}
                    </Badge>
                  </div>
                ))}
                {invitations.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No vendor invitations yet. Click "Invite Vendor" to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Invitations</CardTitle>
              <CardDescription>Track and manage all vendor invitations</CardDescription>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="text-center py-8">Loading invitations...</div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No invitations sent yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation: any) => (
                    <div key={invitation.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{invitation.firstName} {invitation.lastName}</h3>
                            <Badge variant={invitation.status === 'pending' ? 'secondary' : 
                                          invitation.status === 'accepted' ? 'default' : 'destructive'}>
                              {invitation.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">{invitation.companyName}</p>
                          {invitation.customMessage && (
                            <p className="text-sm text-slate-600 mt-2 italic">"{invitation.customMessage}"</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {invitation.status === 'pending' && (
                            <Button variant="outline" size="sm">
                              <Send className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Onboarding Forms</CardTitle>
              <CardDescription>Monitor vendor data collection and verification</CardDescription>
            </CardHeader>
            <CardContent>
              {formsLoading ? (
                <div className="text-center py-8">Loading onboarding forms...</div>
              ) : onboardingForms.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No onboarding forms submitted yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {onboardingForms.map((form: any) => (
                    <div key={form.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{form.vendorName || "Unknown Vendor"}</h3>
                            <Badge variant={form.status === 'draft' ? 'secondary' : 
                                          form.status === 'submitted' ? 'default' :
                                          form.status === 'under_review' ? 'secondary' :
                                          form.status === 'approved' ? 'default' : 'destructive'}>
                              {form.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Progress:</span>
                              <Progress value={form.completionPercentage || 0} className="w-24" />
                              <span className="text-sm">{form.completionPercentage || 0}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflows</CardTitle>
              <CardDescription>Manage vendor approval processes and scoring</CardDescription>
            </CardHeader>
            <CardContent>
              {workflowsLoading ? (
                <div className="text-center py-8">Loading approval workflows...</div>
              ) : approvalWorkflows.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No approval workflows in progress</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvalWorkflows.map((workflow: any) => (
                    <div key={workflow.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{workflow.vendorName || "Unknown Vendor"}</h3>
                            <Badge variant={workflow.finalStatus === 'pending' ? 'secondary' : 
                                          workflow.finalStatus === 'approved' ? 'default' : 'destructive'}>
                              {workflow.finalStatus}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              Step {workflow.currentStep} of {workflow.workflowSteps?.length || 1}
                            </span>
                            {workflow.overallScore && (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{workflow.overallScore}/100</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}