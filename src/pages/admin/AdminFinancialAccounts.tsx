import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts";
import { Plus, Pencil, Trash2, Loader2, Building2, Wallet, DollarSign, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const accountTypes = [
  { value: "bank", label: "Conta Bancária", icon: Building2 },
  { value: "cash", label: "Caixa Físico", icon: Wallet },
  { value: "digital", label: "Carteira Digital", icon: DollarSign },
];

export default function AdminFinancialAccounts() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "bank",
    description: "",
    initial_balance: "",
    bank_name: "",
    bank_agency: "",
    bank_account: "",
    is_default: false,
    is_active: true,
  });

  const { accounts, isLoading, createAccount, updateAccount, deleteAccount, totalBalance } = useFinancialAccounts();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "bank",
      description: "",
      initial_balance: "",
      bank_name: "",
      bank_agency: "",
      bank_account: "",
      is_default: false,
      is_active: true,
    });
    setEditingId(null);
  };

  const handleEdit = (account: any) => {
    setFormData({
      name: account.name,
      type: account.type,
      description: account.description || "",
      initial_balance: account.initial_balance?.toString() || "0",
      bank_name: account.bank_name || "",
      bank_agency: account.bank_agency || "",
      bank_account: account.bank_account || "",
      is_default: account.is_default || false,
      is_active: account.is_active ?? true,
    });
    setEditingId(account.id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      type: formData.type,
      description: formData.description || null,
      initial_balance: parseFloat(formData.initial_balance) || 0,
      bank_name: formData.bank_name || null,
      bank_agency: formData.bank_agency || null,
      bank_account: formData.bank_account || null,
      is_default: formData.is_default,
      is_active: formData.is_active,
    };

    if (editingId) {
      await updateAccount.mutateAsync({ id: editingId, ...data });
    } else {
      await createAccount.mutateAsync(data);
    }

    setIsOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta conta?")) return;
    await deleteAccount.mutateAsync(id);
  };

  const getAccountIcon = (type: string) => {
    const accountType = accountTypes.find(t => t.value === type);
    const Icon = accountType?.icon || Wallet;
    return <Icon className="h-5 w-5" />;
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case "bank": return "bg-blue-100 text-blue-600";
      case "cash": return "bg-emerald-100 text-emerald-600";
      case "digital": return "bg-purple-100 text-purple-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/financial">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Contas / Caixas</h1>
            <p className="text-muted-foreground">
              Gerencie as contas bancárias e caixas da igreja
            </p>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Conta" : "Nova Conta"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Conta Bradesco, Caixa Geral"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Saldo Inicial (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              {formData.type === "bank" && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium text-sm">Dados Bancários</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Banco</Label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        placeholder="Ex: Bradesco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Agência</Label>
                      <Input
                        value={formData.bank_agency}
                        onChange={(e) => setFormData({ ...formData, bank_agency: e.target.value })}
                        placeholder="1234"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Conta</Label>
                      <Input
                        value={formData.bank_account}
                        onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                        placeholder="12345-6"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_default}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                  />
                  <Label className="cursor-pointer">Conta padrão</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label className="cursor-pointer">Ativa</Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createAccount.isPending || updateAccount.isPending}
              >
                {(createAccount.isPending || updateAccount.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingId ? "Salvar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Saldo Total */}
      <Card className="p-6 border-l-4 border-l-primary">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Saldo Total</p>
            <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="p-4 rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !accounts || accounts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhuma conta cadastrada</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className={`p-4 ${!account.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${getAccountColor(account.type)}`}>
                    {getAccountIcon(account.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{account.name}</h3>
                      {account.is_default && (
                        <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {accountTypes.find(t => t.value === account.type)?.label}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(account.id)}
                    disabled={deleteAccount.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {account.description && (
                <p className="text-sm text-muted-foreground mb-3">{account.description}</p>
              )}

              {account.type === "bank" && account.bank_name && (
                <div className="text-xs text-muted-foreground mb-3">
                  {account.bank_name}
                  {account.bank_agency && ` • Ag: ${account.bank_agency}`}
                  {account.bank_account && ` • Cc: ${account.bank_account}`}
                </div>
              )}

              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className={`text-xl font-bold ${Number(account.current_balance) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(Number(account.current_balance))}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
