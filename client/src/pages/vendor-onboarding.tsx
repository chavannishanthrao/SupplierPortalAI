import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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



export default function VendorOnboardingPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("invites");
  const [, setLocation] = useLocation();

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
        
        <Button 
          onClick={() => setLocation("/vendor-onboarding/invite")}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite Vendor
        </Button>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="invites">Invites</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
          <TabsTrigger value="active">Active Suppliers</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {/* Stage 1: Invites Tab */}
        <TabsContent value="invites" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Invitations</CardTitle>
              <CardDescription>Track and manage all vendor invitations sent to potential suppliers</CardDescription>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="text-center py-8">Loading invitations...</div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No invitations sent yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click "Invite Vendor" to send your first invitation
                  </p>
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

        {/* Stage 2: Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Under Review</CardTitle>
              <CardDescription>Vendor applications currently being reviewed and evaluated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No vendor applications under review</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vendors who have submitted their onboarding forms will appear here for evaluation
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stage 3: Withdrawn Tab */}
        <TabsContent value="withdrawn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawn Applications</CardTitle>
              <CardDescription>Vendor applications that have been withdrawn or cancelled</CardDescription>
            </CardHeader>
            <CardContent>
              {formsLoading ? (
                <div className="text-center py-8">Loading onboarding forms...</div>
              ) : onboardingForms.length === 0 ? (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No withdrawn applications</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vendors who withdraw their applications will be listed here
                  </p>
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

        {/* Stage 4: Active Suppliers Tab */}
        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Suppliers</CardTitle>
              <CardDescription>Approved and active vendor partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No active suppliers yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Approved vendors will appear here once they complete onboarding
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stage 5: Rejected Tab */}
        <TabsContent value="rejected" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Applications</CardTitle>
              <CardDescription>Vendor applications that have been rejected during the review process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No rejected applications</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vendors whose applications are rejected will be listed here with rejection reasons
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}