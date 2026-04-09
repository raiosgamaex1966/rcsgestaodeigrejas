import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllRequests, useUpdateRequestStatus, RequestStatus } from "@/hooks/useRequests";
import { toast } from "@/hooks/use-toast";
import {
  HandHeart,
  Droplets,
  Package,
  MapPin,
  Users,
  AlertCircle,
  Clock,
  Phone,
  Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

const requestTypeInfo: Record<string, { label: string; icon: any; color: string }> = {
  prayer: { label: "Oração", icon: HandHeart, color: "bg-burgundy/10 text-burgundy" },
  baptism: { label: "Batismo", icon: Droplets, color: "bg-primary/10 text-primary" },
  food_basket: { label: "Cesta Básica", icon: Package, color: "bg-accent/10 text-accent" },
  visitation: { label: "Visita", icon: MapPin, color: "bg-indigo-light/10 text-indigo-light" },
  visit: { label: "Visita", icon: MapPin, color: "bg-indigo-light/10 text-indigo-light" },
  pastoral: { label: "Direção Pastoral", icon: Users, color: "bg-gold/10 text-gold" },
};

const statusOptions: { value: RequestStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "in_progress", label: "Em andamento" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" },
];

const AdminRequests = () => {
  const { data: requests = [], isLoading } = useAllRequests();
  const updateStatus = useUpdateRequestStatus();

  const handleStatusChange = async (id: string, status: RequestStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: "Status atualizado!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "pending": return "bg-accent/20 text-accent";
      case "in_progress": return "bg-primary/20 text-primary";
      case "completed": return "bg-green-500/20 text-green-600";
      case "cancelled": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Solicitações</h1>
        <p className="text-muted-foreground">Gerencie as solicitações dos membros</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhuma solicitação recebida</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const typeInfo = requestTypeInfo[request.type];
            const Icon = typeInfo?.icon || HandHeart;

            return (
              <Card key={request.id} variant="elevated" className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("p-3 rounded-xl shrink-0", typeInfo?.color)}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{request.name}</span>
                      {request.is_urgent && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-destructive/20 text-destructive rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Urgente
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {typeInfo?.label || request.type}
                    </p>

                    <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">
                      {request.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      {request.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {request.phone}
                        </span>
                      )}
                      {request.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {request.email}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Select
                      value={request.status}
                      onValueChange={(v: RequestStatus) => handleStatusChange(request.id, v)}
                    >
                      <SelectTrigger className={cn("w-36", getStatusColor(request.status))}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
