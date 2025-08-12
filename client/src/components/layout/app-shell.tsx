import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { CompanyType } from "@/types";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [companyType, setCompanyType] = useState<CompanyType>('manufacturing');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar 
        companyType={companyType}
        onCompanyTypeChange={setCompanyType}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuClose={() => setIsMobileMenuOpen(false)}
      />
      
      <main className="flex-1 flex flex-col">
        <Header onMobileMenuToggle={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
