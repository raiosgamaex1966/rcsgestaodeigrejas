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
import { useExpenseEntries } from "@/hooks/useExpenseEntries";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, CalendarIcon, TrendingDown, Filter, X, Check, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfMonth, endOfMonth, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const paymentMethods = [
  { value: "pix", label: "PIX" },
  { value: "cash", label: "Dinheiro" },
  { value: "transfer", label: "Transferência" },
  { value: "card", label: "Cartão" },
  { value: "check", label: "Cheque" },
  { value: "boleto", label: "Boleto" },
  { value: "other", label: "Outro" },
];

const statusOptions = [
  { value: "pending", label: "Pendente", icon: Clock, color: "text-amber-600 bg-amber-100" },
  { value: "paid", label: "Pago", icon: Check, color: "text-emerald-600 bg-emerald-100" },
];

export default function AdminExpenseEntries() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    categoryId: "",
    accountId: "",
    status: "",
  });
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date(),
    due_date: "",
    category_id: "",
    account_id: "",
    description: "",
    supplier_name: "",
    payment_method: "pix",
    status: "pending",
  });

  const { entries, isLoading, totalExpenses, totalPaid, totalPending, createEntry, updateEntry, markAsPaid, deleteEntry } = useExpenseEntries({
    startDate: format(filters.startDate, "yyyy-MM-dd"),
    endDate: format(filters.endDate, "yyyy-MM-dd"),
    categoryId: filters.categoryId || undefined,
    accountId: filters.accountId || undefined,
    status: filters.status as "pending" | "paid" | undefined || undefined,
  });
  const { expenseCategories } = useFinancialCategories("expense");
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
      due_date: "",
      category_id: "",
      account_id: accounts?.find(a => a.is_default)?.id || "",
      description: "",
      supplier_name: "",
      payment_method: "pix",
      status: "pending",
    });
    setEditingId(null);
  };

  const handleEdit = (entry: any) => {
    setFormData({
      amount: entry.amount?.toString() || "",
      date: new Date(entry.date),
      due_date: entry.due_date || "",
      category_id: entry.category_id || "",
      account_id: entry.account_id || "",
      description: entry.description || "",
      supplier_name: entry.supplier_name || "",
      payment_method: entry.payment_method || "pix",
      status: entry.status || "pending",
    });
    setEditingId(entry.id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      amount: parseFloat(formData.amount),
      date: format(formData.date, "yyyy-MM-dd"),
      due_date: formData.due_date || null,
      category_id: formData.category_id || null,
      account_id: formData.account_id || null,
      description: formData.description,
      supplier_name: formData.supplier_name || null,
      payment_method: formData.payment_method,
      status: formData.status,
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
    if (!confirm("Deseja realmente excluir esta despesa?")) return;
    await deleteEntry.mutateAsync(id);
  };

  const handleMarkAsPaid = async (entry: any) => {
    if (!confirm(`Confirma o pagamento de ${formatCurrency(entry.amount)}?`)) return;
    await markAsPaid.mutateAsync({ id: entry.id, accountId: entry.account_id });
  };

  const clearFilters = () => {
    setFilters({
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      categoryId: "",
      accountId: "",
      status: "",
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === "paid" || !dueDate) return false;
    return isBefore(new Date(dueDate), new Date());
  };

  const isDueSoon = (dueDate: string, status: string) => {
    if (status === "paid" || !dueDate) return false;
    const due = new Date(dueDate);
    const threeDaysFromNow = addDays(new Date(), 3);
    return !isBefore(due, new Date()) && isBefore(due, threeDaysFromNow);
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
            <h1 className="text-2xl font-bold">Despesas</h1>
            <p className="text-muted-foreground">
              Registre e gerencie as saídas financeiras
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
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Despesa" : "Nova Despesa"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Descrição *</Label>
                  <Input
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Conta de luz, Aluguel"
                  />
                </div>

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
                    <Label>Vencimento</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <status.icon className="h-4 w-4" />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#ef4444' }} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Conta</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fornecedor</Label>
                    <Input
                      value={formData.supplier_name}
                      onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                      placeholder="Nome do fornecedor"
                    />
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              <Select value={filters.categoryId || "all"} onValueChange={(value) => setFilters({ ...filters, categoryId: value === "all" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
              <Select value={filters.accountId || "all"} onValueChange={(value) => setFilters({ ...filters, accountId: value === "all" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {accounts?.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status || "all"} onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total no Período</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pago</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="p-3 rounded-full bg-emerald-100">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pendente</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
            </div>
            <div className="p-3 rounded-full bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !entries || entries.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhuma despesa encontrada no período</p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id} className={isOverdue(entry.due_date || '', entry.status || '') ? 'bg-red-50' : ''}>
                  <TableCell>{format(new Date(entry.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{entry.description}</p>
                      {entry.supplier_name && (
                        <p className="text-xs text-muted-foreground">{entry.supplier_name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.category?.color || '#ef4444' }}
                      />
                      {entry.category?.name || "-"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.due_date ? (
                      <div className="flex items-center gap-1">
                        {isOverdue(entry.due_date, entry.status || '') && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        {isDueSoon(entry.due_date, entry.status || '') && (
                          <Clock className="h-4 w-4 text-amber-500" />
                        )}
                        {format(new Date(entry.due_date), "dd/MM/yyyy")}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={entry.status === 'paid' ? 'default' : 'outline'}
                      className={entry.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'text-amber-600 border-amber-300'}
                    >
                      {entry.status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {formatCurrency(entry.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {entry.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsPaid(entry)}
                          disabled={markAsPaid.isPending}
                          title="Marcar como pago"
                        >
                          <Check className="h-4 w-4 text-emerald-600" />
                        </Button>
                      )}
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
