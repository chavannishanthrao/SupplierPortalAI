import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, Building2, FileText, MessageSquare, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Link className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">SupplyChain Pro</h1>
            </div>
            <Button 
              onClick={() => window.location.href = '/login'}
              data-testid="button-login"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold text-slate-900 mb-6">
            Advanced Supplier Portal
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Streamline your supplier relationships with our comprehensive multi-tenant platform. 
            Perfect for both manufacturing and service-based companies.
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = '/login'}
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Everything you need to manage suppliers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card>
              <CardHeader>
                <Building2 className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Multi-Tenant</CardTitle>
                <CardDescription>
                  Complete tenant isolation with role-based access control
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Order Management</CardTitle>
                <CardDescription>
                  Handle Purchase Orders and Work Orders with ease
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Communication</CardTitle>
                <CardDescription>
                  Built-in messaging and collaboration tools
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Compliance</CardTitle>
                <CardDescription>
                  Document management and compliance tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Types */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Built for Manufacturing & Service Companies
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Manufacturing Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600">
                  <li>• Purchase Order management with SKUs</li>
                  <li>• Batch and lot number tracking</li>
                  <li>• Quality inspections and certifications</li>
                  <li>• Production scheduling (MPS)</li>
                  <li>• Shipment tracking and logistics</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Service Companies</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-slate-600">
                  <li>• Work Order and project management</li>
                  <li>• Milestone and deliverable tracking</li>
                  <li>• SLA compliance monitoring</li>
                  <li>• Timesheet and resource management</li>
                  <li>• Performance metrics and reporting</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to transform your supplier management?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of companies already using SupplyChain Pro
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-start-now"
          >
            Start Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2024 SupplyChain Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
