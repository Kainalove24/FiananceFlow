import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, X } from "lucide-react";
import { format } from "date-fns";

interface BudgetCategory {
  id: number;
  name: string;
}

interface Account {
  id: number;
  name: string;
}

interface TransactionFiltersProps {
  onFilterChange?: (filters: any) => void;
  budgetCategories?: BudgetCategory[];
  accounts?: Account[];
}

export function TransactionFilters({ onFilterChange, budgetCategories = [], accounts = [] }: TransactionFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const handleReset = () => {
    setSearchTerm("");
    setCategory("");
    setAccount("");
    setDateFrom(undefined);
    setDateTo(undefined);
    onFilterChange?.({});
  };

  const handleApply = () => {
    onFilterChange?.({
      searchTerm,
      category,
      account,
      dateFrom,
      dateTo,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-transactions"
            />
          </div>
        </div>
        
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]" data-testid="select-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {budgetCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name.toLowerCase()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={account} onValueChange={setAccount}>
          <SelectTrigger className="w-[180px]" data-testid="select-account">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.name.toLowerCase()}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start" data-testid="button-date-from">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-start" data-testid="button-date-to">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApply} data-testid="button-apply-filters">
          Apply Filters
        </Button>
        <Button variant="outline" onClick={handleReset} data-testid="button-reset-filters">
          <X className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
}
