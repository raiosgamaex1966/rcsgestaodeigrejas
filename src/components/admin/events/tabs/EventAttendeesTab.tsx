import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Download, MoreVertical, CheckCircle, Clock, XCircle, UserPlus, Loader2, Globe, CreditCard } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface EventAttendeesTabProps {
  eventId: string;
  registrationLimit?: number | null;
}

export const EventAttendeesTab = ({ eventId, registrationLimit }: EventAttendeesTabProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("members");
  
  const queryClient = useQueryClient();

  // Fetch registered members (event_attendees)
  const { data: attendees = [], isLoading } = useQuery({
    queryKey: ["event-attendees-full", eventId],
    queryFn: async () => {
      const { data: attendeesData, error: attendeesError } = await supabase
        .from("event_attendees")
        .select("*")
        .eq("event_id", eventId)
        .order("confirmed_at", { ascending: false });

      if (attendeesError) throw attendeesError;
      if (!attendeesData || attendeesData.length === 0) return [];

      const userIds = attendeesData.map(a => a.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, phone")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return attendeesData.map(a => ({
        ...a,
        profile: profilesMap.get(a.user_id) || null
      }));
    },
  });

  // Fetch public registrations (event_registrations)
  const { data: publicRegistrations = [], isLoading: isLoadingPublic } = useQuery({
    queryKey: ["event-registrations", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Search for members to add
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ["members-search", memberSearch],
    queryFn: async () => {
      if (!memberSearch || memberSearch.length < 2) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .or(`full_name.ilike.%${memberSearch}%,email.ilike.%${memberSearch}%`)
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: memberSearch.length >= 2,
  });

  const availableMembers = searchResults.filter(
    member => !attendees.some(a => a.user_id === member.id)
  );

  // Add attendee mutation
  const addAttendeeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("event_attendees")
        .insert({
          event_id: eventId,
          user_id: userId,
          status: "confirmed",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-attendees-full", eventId] });
      toast.success("Participante adicionado com sucesso!");
      setAddDialogOpen(false);
      setMemberSearch("");
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar participante: " + error.message);
    },
  });

  // Remove attendee mutation
  const removeAttendeeMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const { error } = await supabase
        .from("event_attendees")
        .delete()
        .eq("id", attendeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-attendees-full", eventId] });
      toast.success("Participante removido");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover participante: " + error.message);
    },
  });

  // Update public registration payment status
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("event_registrations")
        .update({ payment_status: status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-registrations", eventId] });
      toast.success("Status de pagamento atualizado");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  // Remove public registration mutation
  const removePublicRegistrationMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", registrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-registrations", eventId] });
      toast.success("Inscrição removida");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover inscrição: " + error.message);
    },
  });

  const filteredAttendees = attendees.filter(attendee => {
    const profile = attendee.profile as any;
    const matchesSearch = !search || 
      profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      profile?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || attendee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPublicRegistrations = publicRegistrations.filter(reg => {
    const matchesSearch = !search || 
      reg.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      reg.email?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Total counts including both tables
  const memberConfirmedCount = attendees.filter(a => a.status === "confirmed").length;
  const memberPendingCount = attendees.filter(a => a.status === "pending").length;
  const publicConfirmedCount = publicRegistrations.filter(r => r.payment_status === "confirmed").length;
  const publicPendingCount = publicRegistrations.filter(r => r.payment_status === "pending").length;
  
  const totalCount = attendees.length + publicRegistrations.length;
  const totalConfirmed = memberConfirmedCount + publicConfirmedCount;
  const progress = registrationLimit ? (totalCount / registrationLimit) * 100 : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="w-3 h-3" />Confirmado</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="gap-1 bg-green-600"><CreditCard className="w-3 h-3" />Pago</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status || "Pendente"}</Badge>;
    }
  };

  const exportAttendees = () => {
    const memberRows = filteredAttendees.map(a => {
      const profile = a.profile as any;
      return [
        profile?.full_name || "",
        profile?.email || "",
        profile?.phone || "",
        a.status || "",
        "Membro",
        a.confirmed_at ? format(parseISO(a.confirmed_at), "dd/MM/yyyy HH:mm") : ""
      ].join(",");
    });

    const publicRows = filteredPublicRegistrations.map(r => {
      return [
        r.full_name || "",
        r.email || "",
        r.phone || "",
        r.payment_status || "pending",
        "Público",
        r.registered_at ? format(parseISO(r.registered_at), "dd/MM/yyyy HH:mm") : ""
      ].join(",");
    });

    const csv = [
      ["Nome", "Email", "Telefone", "Status", "Tipo", "Data Inscrição"].join(","),
      ...memberRows,
      ...publicRows
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "inscritos-evento.csv";
    link.click();
  };

  const handleAddMember = () => {
    if (selectedMember) {
      addAttendeeMutation.mutate(selectedMember.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-semibold">Total de Inscritos</span>
            </div>
            <span className="text-lg font-bold">
              {totalCount}
              {registrationLimit && `/${registrationLimit}`}
            </span>
          </div>
          {registrationLimit && (
            <>
              <Progress value={Math.min(progress, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(progress)}% das vagas preenchidas
              </p>
            </>
          )}
          <div className="flex gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Membros:</span>
              <span className="font-medium">{attendees.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Públicas:</span>
              <span className="font-medium">{publicRegistrations.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar inscrito..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportAttendees}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Tabs for Members vs Public */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members" className="gap-2">
            <Users className="w-4 h-4" />
            Membros ({attendees.length})
          </TabsTrigger>
          <TabsTrigger value="public" className="gap-2">
            <Globe className="w-4 h-4" />
            Inscrições Públicas ({publicRegistrations.length})
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Carregando...</div>
              ) : filteredAttendees.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum membro inscrito encontrado.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Participante</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Inscrição</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendees.map((attendee) => {
                      const profile = attendee.profile as any;
                      return (
                        <TableRow key={attendee.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={profile?.avatar_url || ""} />
                                <AvatarFallback>
                                  {profile?.full_name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{profile?.full_name || "Sem nome"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {profile?.email && <p>{profile.email}</p>}
                              {profile?.phone && <p className="text-muted-foreground">{profile.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(attendee.status || "confirmed")}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {attendee.confirmed_at 
                              ? format(parseISO(attendee.confirmed_at), "dd/MM/yyyy", { locale: ptBR })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => removeAttendeeMutation.mutate(attendee.id)}
                                >
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Public Registrations Tab */}
        <TabsContent value="public" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoadingPublic ? (
                <div className="p-8 text-center text-muted-foreground">Carregando...</div>
              ) : filteredPublicRegistrations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhuma inscrição pública encontrada.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Data Inscrição</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPublicRegistrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {registration.full_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{registration.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{registration.email}</p>
                            {registration.phone && <p className="text-muted-foreground">{registration.phone}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(registration.payment_status || "pending")}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {registration.registered_at 
                            ? format(parseISO(registration.registered_at), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {registration.notes || "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {registration.payment_status !== "confirmed" && (
                                <DropdownMenuItem 
                                  onClick={() => updatePaymentStatusMutation.mutate({ 
                                    id: registration.id, 
                                    status: "confirmed" 
                                  })}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Confirmar Pagamento
                                </DropdownMenuItem>
                              )}
                              {registration.payment_status === "confirmed" && (
                                <DropdownMenuItem 
                                  onClick={() => updatePaymentStatusMutation.mutate({ 
                                    id: registration.id, 
                                    status: "pending" 
                                  })}
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Marcar como Pendente
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => removePublicRegistrationMutation.mutate(registration.id)}
                              >
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Attendee Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Participante</DialogTitle>
            <DialogDescription>
              Busque um membro cadastrado para adicionar ao evento.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar membro</Label>
              <Input
                placeholder="Digite o nome ou email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isSearching && memberSearch.length >= 2 && availableMembers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum membro encontrado.
              </p>
            )}

            {availableMembers.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedMember?.id === member.id
                        ? "bg-primary/10 border border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar_url || ""} />
                      <AvatarFallback>
                        {member.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.full_name || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddMember} 
                disabled={!selectedMember || addAttendeeMutation.isPending}
              >
                {addAttendeeMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
