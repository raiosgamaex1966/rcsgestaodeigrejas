import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIncomeEntries } from "@/hooks/useIncomeEntries";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, CalendarIcon, TrendingUp, Filter, X } from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const paymentMethods = [
  { value: "pix", label: "PIX" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
  { value: "card", label: "Cartão" },
  { value: "check", label: "Cheque" },
  { value: "other", label: "Outro" },
];

export default function AdminIncomeEntries() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    categoryId: "",
    accountId: "",
  });
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date(),
    category_id: "",
    account_id: "",
    description: "",
    contributor_name: "",
    contributor_email: "",
    contributor_phone: "",
    payment_method: "pix",
  });

  const { entries, isLoading, totalIncome, createEntry, updateEntry, deleteEntry } = useIncomeEntries({
    startDate: format(filters.startDate, "yyyy-MM-dd"),
    endDate: format(filters.endDate, "yyyy-MM-dd"),
    categoryId: filters.categoryId || undefined,
    accountId: filters.accountId || undefined,
  });
  const { incomeCategories } = useFinancialCategories("income");
  const { accounts } = useFinancialAccounts();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      date: new Date(),
      category_id: "",
      account_id: accounts?.find(a => a.is_default)?.id || "",
      description: "",
      contributor_name: "",
      contributor_email: "",
      contributor_phone: "",
      payment_method: "pix",
    });
    setEditingId(null);
  };

  const handleEdit = (entry: any) => {
    setFormData({
      amount: entry.amount?.toString() || "",
      date: new Date(entry.date),
      category_id: entry.category_id || "",
      account_id: entry.account_id || "",
      description: entry.description || "",
      contributor_name: entry.contributor_name || "",
      contributor_email: entry.contributor_email || "",
      contributor_phone: entry.contributor_phone || "",
      payment_method: entry.payment_method || "pix",
    });
    setEditingId(entry.id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      amount: parseFloat(formData.amount),
      date: format(formData.date, "yyyy-MM-dd"),
      category_id: formData.category_id || null,
      account_id: formData.account_id || null,
      description: formData.description || null,
      contributor_name: formData.contributor_name || null,
      contributor_email: formData.contributor_email || null,
      contributor_phone: formData.contributor_phone || null,
      payment_method: formData.payment_method,
    };

    if (editingId) {
      await updateEntry.mutateAsync({ id: editingId, ...data });
    } else {
      await createEntry.mutateAsync(data);
    }

    setIsOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta receita?")) return;
    await deleteEntry.mutateAsync(id);
  };

  const clearFilters = () => {
    setFilters({
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      categoryId: "",
      accountId: "",
    });
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
            <h1 className="text-2xl font-bold">Receitas</h1>
            <p className="text-muted-foreground">
              Registre e gerencie as entradas financeiras
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Receita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Receita" : "Nova Receita"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valor (R$) *</Label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(formData.date, "dd/MM/yyyy") : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => date && setFormData({ ...formData, date })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {incomeCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#6366f1' }} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Conta Destino</Label>
                    <Select
                      value={formData.account_id}
                      onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
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
                    placeholder="Observações..."
                    rows={2}
                  />
                </div>

                <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                  <h4 className="font-medium text-sm">Dados do Contribuinte (opcional)</h4>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      value={formData.contributor_name}
                      onChange={(e) => setFormData({ ...formData, contributor_name: e.target.value })}
                      placeholder="Nome do contribuinte"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={formData.contributor_email}
                        onChange={(e) => setFormData({ ...formData, contributor_email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      <Input
                        value={formData.contributor_phone}
                        onChange={(e) => setFormData({ ...formData, contributor_phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createEntry.isPending || updateEntry.isPending}
                >
                  {(createEntry.isPending || updateEntry.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? "Salvar" : "Registrar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Filtros</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(filters.startDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => date && setFilters({ ...filters, startDate: date })}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(filters.endDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => date && setFilters({ ...filters, endDate: date })}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={filters.categoryId} onValueChange={(value) => setFilters({ ...filters, categoryId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {incomeCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select value={filters.accountId} onValueChange={(value) => setFilters({ ...filters, accountId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {accounts?.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* Total */}
      <Card className="p-6 border-l-4 border-l-emerald-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Total no Período ({format(filters.startDate, "dd/MM")} - {format(filters.endDate, "dd/MM")})
            </p>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="p-4 rounded-full bg-emerald-100">
            <TrendingUp className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
      </Card>

      {/* Tabela */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhuma receita encontrada no período</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Contribuinte</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.category?.color || '#6366f1' }}
                      />
                      {entry.category?.name || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{entry.contributor_name || "-"}</p>
                      {entry.description && (
                        <p className="text-xs text-muted-foreground">{entry.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {paymentMethods.find(m => m.value === entry.payment_method)?.label || entry.payment_method}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600">
                    {formatCurrency(entry.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleteEntry.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
