import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  UserPlus, 
  Building, 
  User, 
  Calendar, 
  Tag,
  CreditCard,
  Mail,
  Phone,
  FileText,
  Save,
  Send,
  CheckCircle2
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

export default function VendorInvitePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

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

  // Mutations for saving and sending invitations
  const saveDraftMutation = useMutation({
    mutationFn: (data: InviteVendorForm) =>
      apiRequest("/api/vendor-invitations/draft", { method: "POST", data }),
    onSuccess: () => {
      toast({
        title: "Draft Saved",
        description: "Vendor invitation has been saved as draft",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save draft",
        variant: "destructive",
      });
    },
  });

  const inviteVendorMutation = useMutation({
    mutationFn: (data: InviteVendorForm) =>
      apiRequest("/api/vendor-invitations", { method: "POST", data }),
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Vendor invitation has been sent successfully with login credentials",
      });
      setLocation("/vendor-onboarding");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const onSaveDraft = (data: InviteVendorForm) => {
    saveDraftMutation.mutate(data);
  };

  const onSendInvitation = (data: InviteVendorForm) => {
    inviteVendorMutation.mutate(data);
  };

  const steps = [
    { id: 1, title: "Basic Information", icon: Building },
    { id: 2, title: "Contact Details", icon: User },
    { id: 3, title: "Email & Message", icon: Mail },
  ];

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={inviteForm.control}
                name="entityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Entity Selection
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select your business entity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {entities.map((entity: any) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{entity.code}</Badge>
                              {entity.name}
                            </div>
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
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Supplier Name *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter supplier company name" 
                        className="h-12"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={inviteForm.control}
                name="requestorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Requestor *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select the person requesting this supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {requestors.map((user: any) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">{user.role}</div>
                            </div>
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
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Response Due Date *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        className="h-12"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={inviteForm.control}
                name="supplierCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Supplier Category *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select supplier category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="logistics">Logistics</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="raw-materials">Raw Materials</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
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
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Default Payment Terms *
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="net-15">Net 15 days</SelectItem>
                        <SelectItem value="net-30">Net 30 days</SelectItem>
                        <SelectItem value="net-45">Net 45 days</SelectItem>
                        <SelectItem value="net-60">Net 60 days</SelectItem>
                        <SelectItem value="immediate">Immediate Payment</SelectItem>
                        <SelectItem value="cod">Cash on Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            {/* Primary Contact */}
            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Primary Contact Details
                </CardTitle>
                <CardDescription>
                  The main point of contact for this supplier relationship
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={inviteForm.control}
                    name="primaryContactFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" className="h-11" {...field} />
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
                          <Input placeholder="Doe" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={inviteForm.control}
                    name="primaryContactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="john.doe@supplier.com" 
                            className="h-11"
                            {...field} 
                          />
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
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+1 (555) 123-4567" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Secondary Contact */}
            <Card className="border-muted">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-muted-foreground" />
                  Secondary Contact Details
                  <Badge variant="secondary">Optional</Badge>
                </CardTitle>
                <CardDescription>
                  Additional contact person for backup communication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={inviteForm.control}
                    name="secondaryContactFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane" className="h-11" {...field} />
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
                          <Input placeholder="Smith" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={inviteForm.control}
                    name="secondaryContactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="jane.smith@supplier.com" 
                            className="h-11"
                            {...field} 
                          />
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
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="tel" 
                            placeholder="+1 (555) 987-6543" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Select a template and customize the invitation message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={inviteForm.control}
                  name="emailTemplateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Template</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Choose an email template" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {emailTemplates.map((template: any) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-sm text-muted-foreground">{template.subject}</div>
                              </div>
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
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Custom Message
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add a personalized message to include in the invitation email. This will be added to the selected template..."
                          className="min-h-[120px] resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Automatic Login Credentials
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        The system will automatically generate login credentials for the supplier and include them in the invitation email. The supplier will receive:
                      </p>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                        <li>• A secure invitation link to complete onboarding</li>
                        <li>• Temporary login credentials (email and password)</li>
                        <li>• Instructions for accessing the supplier portal</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/vendor-onboarding")}
            className="mb-4 -ml-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendor Onboarding
          </Button>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Invite New Vendor
            </h1>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Create a comprehensive vendor invitation with automated onboarding, login credentials, and reminder tracking.
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep >= step.id 
                    ? 'border-primary bg-primary text-white' 
                    : 'border-muted bg-background text-muted-foreground'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl">
              Step {currentStep}: {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Enter basic supplier information and business details"}
              {currentStep === 2 && "Provide primary and secondary contact information"}
              {currentStep === 3 && "Configure email template and personalized message"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...inviteForm}>
              <form onSubmit={inviteForm.handleSubmit(onSendInvitation)} className="space-y-6">
                {getStepContent()}
                
                <Separator className="my-8" />
                
                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6">
                  <div>
                    {currentStep > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className="min-w-24"
                      >
                        Previous
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={inviteForm.handleSubmit(onSaveDraft)}
                      disabled={saveDraftMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saveDraftMutation.isPending ? "Saving..." : "Save Draft"}
                    </Button>
                    
                    {currentStep < steps.length ? (
                      <Button 
                        type="button" 
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="min-w-24"
                      >
                        Next
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={inviteVendorMutation.isPending}
                        className="flex items-center gap-2 min-w-32"
                      >
                        <Send className="h-4 w-4" />
                        {inviteVendorMutation.isPending ? "Sending..." : "Send Invitation"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}