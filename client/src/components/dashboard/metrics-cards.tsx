import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { File, DollarSign, Truck, Star } from "lucide-react";

export default function MetricsCards() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
  });

  const cards = [
    {
      title: "Active Orders",
      value: metrics?.activeOrders || 0,
      icon: File,
      color: "blue",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Pending Invoices",
      value: metrics?.pendingInvoices || 0,
      icon: DollarSign,
      color: "amber",
      change: "-3%",
      changeType: "negative",
    },
    {
      title: "On-Time Delivery",
      value: metrics?.onTimeDelivery ? `${metrics.onTimeDelivery}%` : "0%",
      icon: Truck,
      color: "green",
      change: "+5.2%",
      changeType: "positive",
    },
    {
      title: "Quality Score",
      value: metrics?.qualityScore ? `${metrics.qualityScore}/10` : "0/10",
      icon: Star,
      color: "purple",
      change: "+0.3",
      changeType: "positive",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600" data-testid={`text-${card.title.toLowerCase().replace(/\s+/g, '-')}-label`}>
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-slate-900" data-testid={`text-${card.title.toLowerCase().replace(/\s+/g, '-')}-value`}>
                  {card.value}
                </p>
              </div>
              <div className={`w-12 h-12 bg-${card.color}-100 rounded-lg flex items-center justify-center`}>
                <card.icon className={`text-${card.color}-600`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`font-medium ${card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                {card.change}
              </span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
