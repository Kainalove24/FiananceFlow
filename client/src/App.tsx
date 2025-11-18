import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardPage from "@/pages/DashboardPage";
import TransactionsPage from "@/pages/TransactionsPage";
import BudgetPlannerPage from "@/pages/BudgetPlannerPage";
import InstallmentsPage from "@/pages/InstallmentsPage";
import AccountsPage from "@/pages/AccountsPage";
import GoalsPage from "@/pages/GoalsPage";
import InvestmentsPage from "@/pages/InvestmentsPage";
import SimulationPage from "@/pages/SimulationPage";
import MonthlyReportsPage from "@/pages/MonthlyReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/budget" component={BudgetPlannerPage} />
      <Route path="/installments" component={InstallmentsPage} />
      <Route path="/accounts" component={AccountsPage} />
      <Route path="/goals" component={GoalsPage} />
      <Route path="/investments" component={InvestmentsPage} />
      <Route path="/simulation" component={SimulationPage} />
      <Route path="/reports" component={MonthlyReportsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center gap-4 border-b px-6 py-3">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </header>
              <main className="flex-1 overflow-auto">
                <div className="container max-w-7xl mx-auto px-8 py-6">
                  <Router />
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
