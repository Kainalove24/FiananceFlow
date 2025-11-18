import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Wallet, CreditCard, Building2, Banknote } from "lucide-react";

interface AccountCardProps {
  id: number;
  name: string;
  type: string;
  balance: number;
  creditLimit?: number;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const accountIcons = {
  cash: Banknote,
  bank: Building2,
  credit_card: CreditCard,
  ewallet: Wallet,
};

export function AccountCard({ id, name, type, balance, creditLimit, onEdit, onDelete }: AccountCardProps) {
  const Icon = accountIcons[type as keyof typeof accountIcons] || Wallet;

  return (
    <Card data-testid={`card-account-${id}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-muted-foreground" />
          <CardTitle className="text-lg font-medium">{name}</CardTitle>
        </div>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit?.(id)}
            data-testid={`button-edit-account-${id}`}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete?.(id)}
            data-testid={`button-delete-account-${id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Badge variant="secondary" data-testid={`badge-account-type-${id}`}>
            {type.replace("_", " ").toUpperCase()}
          </Badge>
          <div className="text-2xl font-bold font-mono" data-testid={`text-account-balance-${id}`}>
            ₱{balance.toFixed(2)}
          </div>
          {creditLimit && (
            <p className="text-xs text-muted-foreground">
              Credit Limit: ₱{creditLimit.toFixed(2)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
