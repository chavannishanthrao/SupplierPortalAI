import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Building, FileText, Settings, LogOut } from "lucide-react";
import ProfileForm from "@/components/forms/profile-form";
import { SupplierProfile } from "@/types";

export default function Profile() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: supplierProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/supplier-profile"],
    enabled: isAuthenticated,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      if (supplierProfile?.id) {
        // Update existing profile
        const response = await fetch(`/api/supplier-profile/${supplierProfile.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
          credentials: "include",
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      } else {
        // Create new profile
        const response = await fetch("/api/supplier-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profileData),
          credentials: "include",
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-profile"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getOnboardingStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStatusColor = (isApproved: boolean) => {
    return isApproved 
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-slate-200 rounded animate-pulse"></div>
            <div className="md:col-span-2 h-96 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Profile</h1>
            <p className="text-slate-600">Manage your supplier profile and account settings</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Overview */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Account Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <img
                    src={user?.profileImageUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80`}
                    alt="Profile"
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                    data-testid="img-user-avatar"
                  />
                  <h3 className="font-semibold text-slate-900" data-testid="text-user-display-name">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || 'User'}
                  </h3>
                  <p className="text-sm text-slate-500" data-testid="text-user-email">
                    {user?.email}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Company:</label>
                    <p className="text-sm text-slate-900" data-testid="text-company-name">
                      {supplierProfile?.companyName || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Company Type:</label>
                    <p className="text-sm text-slate-900" data-testid="text-company-type">
                      {supplierProfile?.companyType ? (
                        <Badge variant="secondary">
                          {supplierProfile.companyType === 'manufacturing' ? 'Manufacturing' : 'Service Provider'}
                        </Badge>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Onboarding Status:</label>
                    <p className="text-sm text-slate-900" data-testid="text-onboarding-status">
                      <Badge className={getOnboardingStatusColor(supplierProfile?.onboardingStatus || 'pending')}>
                        {(supplierProfile?.onboardingStatus || 'pending').replace('_', ' ').toUpperCase()}
                      </Badge>
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">Approval Status:</label>
                    <p className="text-sm text-slate-900" data-testid="text-approval-status">
                      <Badge className={getApprovalStatusColor(supplierProfile?.isApproved || false)}>
                        {supplierProfile?.isApproved ? 'APPROVED' : 'PENDING APPROVAL'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="profile" data-testid="tab-profile">
                      <Building className="h-4 w-4 mr-2" />
                      Company Info
                    </TabsTrigger>
                    <TabsTrigger value="documents" data-testid="tab-documents">
                      <FileText className="h-4 w-4 mr-2" />
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="settings" data-testid="tab-settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="mt-6">
                    <ProfileForm
                      profile={supplierProfile}
                      onSubmit={(data) => updateProfileMutation.mutate(data)}
                      isLoading={updateProfileMutation.isPending}
                    />
                  </TabsContent>

                  <TabsContent value="documents" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900">Required Documents</h3>
                      <div className="grid gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-900">Business License</p>
                                <p className="text-sm text-slate-500">Upload your business registration certificate</p>
                              </div>
                              <Badge variant={supplierProfile?.businessLicense ? "default" : "outline"}>
                                {supplierProfile?.businessLicense ? "Uploaded" : "Required"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-900">Tax ID</p>
                                <p className="text-sm text-slate-500">Provide your tax identification number</p>
                              </div>
                              <Badge variant={supplierProfile?.taxId ? "default" : "outline"}>
                                {supplierProfile?.taxId ? "Provided" : "Required"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-900">Bank Details</p>
                                <p className="text-sm text-slate-500">Banking information for payments</p>
                              </div>
                              <Badge variant={supplierProfile?.bankDetails ? "default" : "outline"}>
                                {supplierProfile?.bankDetails ? "Verified" : "Required"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="mt-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Settings</h3>
                        <div className="space-y-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-slate-900">Notifications</p>
                                  <p className="text-sm text-slate-500">Manage your notification preferences</p>
                                </div>
                                <Button variant="outline" size="sm">Configure</Button>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-slate-900">Security</p>
                                  <p className="text-sm text-slate-500">Two-factor authentication and security settings</p>
                                </div>
                                <Button variant="outline" size="sm">Manage</Button>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-slate-900">Data Export</p>
                                  <p className="text-sm text-slate-500">Download your account data</p>
                                </div>
                                <Button variant="outline" size="sm">Export</Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
