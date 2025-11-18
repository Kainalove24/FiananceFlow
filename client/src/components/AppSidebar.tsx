import { Home, CreditCard, Calendar, Target, Wallet, PieChart, TrendingUp, Calculator, FileText, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Transactions", url: "/transactions", icon: CreditCard },
  { title: "Budget Planner", url: "/budget", icon: PieChart },
  { title: "Monthly Reports", url: "/reports", icon: FileText },
  { title: "Installments", url: "/installments", icon: Calendar },
  { title: "Accounts", url: "/accounts", icon: Wallet },
  { title: "Goals", url: "/goals", icon: Target },
  { title: "Investments", url: "/investments", icon: TrendingUp },
  { title: "Simulation", url: "/simulation", icon: Calculator },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold px-4 py-4">
            Finance Manager
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url} data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}>
                    <Link href={item.url}>
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
