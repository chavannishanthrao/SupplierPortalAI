import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SupplierProfile } from "@/types";

const profileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyType: z.enum(["manufacturing", "service"], {
    required_error: "Please select a company type",
  }),
  businessLicense: z.string().optional(),
  taxId: z.string().optional(),
  bankDetails: z.object({
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    bankName: z.string().optional(),
    isVerified: z.boolean().default(false),
  }).optional(),
  contactInfo: z.object({
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().min(1, "Address is required"),
    website: z.string().optional(),
  }),
  capabilities: z.object({
    skills: z.array(z.string()).optional(),
    productionCapacity: z.number().optional(),
    certifications: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
  }).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  profile?: SupplierProfile | null;
  onSubmit: (data: ProfileFormData) => void;
  isLoading?: boolean;
}

export default function ProfileForm({ 
  profile, 
  onSubmit, 
  isLoading = false 
}: ProfileFormProps) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyName: profile?.companyName || "",
      companyType: profile?.companyType || "manufacturing",
      businessLicense: profile?.businessLicense || "",
      taxId: profile?.taxId || "",
      bankDetails: {
        accountNumber: profile?.bankDetails?.accountNumber || "",
        routingNumber: profile?.bankDetails?.routingNumber || "",
        bankName: profile?.bankDetails?.bankName || "",
        isVerified: profile?.bankDetails?.isVerified || false,
      },
      contactInfo: {
        phone: profile?.contactInfo?.phone || "",
        address: profile?.contactInfo?.address || "",
        website: profile?.contactInfo?.website || "",
      },
      capabilities: {
        skills: profile?.capabilities?.skills || [],
        productionCapacity: profile?.capabilities?.productionCapacity || undefined,
        certifications: profile?.capabilities?.certifications || [],
        locations: profile?.capabilities?.locations || [],
      },
    },
  });

  const watchedCompanyType = form.watch("companyType");

  const handleSubmit = (data: ProfileFormData) => {
    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Company Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Your company name"
                          data-testid="input-company-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-company-type">
                            <SelectValue placeholder="Select company type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="service">Service Provider</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessLicense"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business License Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="License number"
                          data-testid="input-business-license"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID / EIN</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Tax identification number"
                          data-testid="input-tax-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactInfo.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="+1 (555) 123-4567"
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactInfo.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="https://your-company.com"
                          data-testid="input-website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="contactInfo.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Company address"
                            rows={3}
                            data-testid="textarea-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banking Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Banking Information</h3>
                {profile?.bankDetails?.isVerified && (
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bankDetails.bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Bank name"
                          data-testid="input-bank-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankDetails.routingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routing Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="9-digit routing number"
                          data-testid="input-routing-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankDetails.accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Account number"
                          type="password"
                          data-testid="input-account-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {watchedCompanyType === 'manufacturing' ? 'Manufacturing Capabilities' : 'Service Capabilities'}
              </h3>
              
              <div className="space-y-4">
                {watchedCompanyType === 'manufacturing' && (
                  <FormField
                    control={form.control}
                    name="capabilities.productionCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Production Capacity (units per month)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number"
                            placeholder="10000"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-production-capacity"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      {watchedCompanyType === 'manufacturing' ? 'Manufacturing Skills' : 'Service Skills'}
                    </label>
                    <Input 
                      placeholder="Enter skills separated by commas"
                      onChange={(e) => {
                        const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        form.setValue('capabilities.skills', skills);
                      }}
                      defaultValue={profile?.capabilities?.skills?.join(', ') || ''}
                      data-testid="input-skills"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Certifications</label>
                    <Input 
                      placeholder="Enter certifications separated by commas"
                      onChange={(e) => {
                        const certifications = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        form.setValue('capabilities.certifications', certifications);
                      }}
                      defaultValue={profile?.capabilities?.certifications?.join(', ') || ''}
                      data-testid="input-certifications"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    {watchedCompanyType === 'manufacturing' ? 'Plant Locations' : 'Service Locations'}
                  </label>
                  <Input 
                    placeholder="Enter locations separated by commas"
                    onChange={(e) => {
                      const locations = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      form.setValue('capabilities.locations', locations);
                    }}
                    defaultValue={profile?.capabilities?.locations?.join(', ') || ''}
                    data-testid="input-locations"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="submit" 
              disabled={isLoading}
              data-testid="button-save-profile"
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
