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
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().min(1, "Company name is required"),
  customMessage: z.string().optional(),
});

type InviteVendorForm = z.infer<typeof inviteVendorSchema>;

export default function VendorOnboardingPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("dashboard");

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

  // Form for inviting vendors
  const inviteForm = useForm<InviteVendorForm>({
    resolver: zodResolver(inviteVendorSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      companyName: "",
      customMessage: "",
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
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Invite New Vendor</DialogTitle>
              <DialogDescription>
                Send a personalized invitation to onboard a new vendor to your platform.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...inviteForm}>
              <form onSubmit={inviteForm.handleSubmit(onInviteVendor)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={inviteForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={inviteForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={inviteForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="john.doe@company.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={inviteForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Company Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={inviteForm.control}
                  name="customMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add a personalized message to the invitation..." 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogTrigger>
                  <Button type="submit" disabled={inviteVendorMutation.isPending}>
                    {inviteVendorMutation.isPending ? "Sending..." : "Send Invitation"}
                  </Button>
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