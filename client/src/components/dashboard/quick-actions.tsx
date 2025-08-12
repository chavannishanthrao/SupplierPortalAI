import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, CalendarCheck, Headphones } from "lucide-react";
import { useLocation } from "wouter";

export default function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      title: "Create Invoice",
      icon: FileText,
      onClick: () => setLocation("/invoices?action=create"),
    },
    {
      title: "Upload Document",
      icon: Upload,
      onClick: () => setLocation("/documents?action=upload"),
    },
    {
      title: "Update Schedule",
      icon: CalendarCheck,
      onClick: () => setLocation("/purchase-orders"),
    },
    {
      title: "Contact Support",
      icon: Headphones,
      onClick: () => setLocation("/messages?action=support"),
    },
  ];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex flex-col items-center justify-center p-6 h-auto border-2 border-dashed hover:border-primary hover:bg-blue-50 transition-all"
              onClick={action.onClick}
              data-testid={`button-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <action.icon className="text-primary text-xl mb-2" />
              <span className="text-sm font-medium text-slate-700">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
