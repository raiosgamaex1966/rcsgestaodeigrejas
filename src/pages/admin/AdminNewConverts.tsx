import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Heart, Search, Phone, UserCheck, Calendar, Droplets } from "lucide-react";
import { toast } from "sonner";
import { MemberProfile } from "@/hooks/useMembers";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminNewConverts = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [promoteMember, setPromoteMember] = useState<MemberProfile | null>(null);

  const { data: newConverts, isLoading } = useQuery({
    queryKey: ['admin-new-converts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('member_type', 'novo_convertido')
        .order('conversion_date', { ascending: false });
      if (error) throw error;
      return data as MemberProfile[];
    },
  });

  const updateMemberType = useMutation({
    mutationFn: async ({ id, memberSince }: { id: string; memberSince: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ member_type: 'membro', member_since: memberSince })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      // Verificar se alguma linha foi afetada
      if (!data || data.length === 0) {
        throw new Error('Não foi possível atualizar o perfil. Verifique suas permissões de administrador.');
      }
      
      // Registrar no histórico do membro
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('member_history').insert({
        member_id: id,
        action_type: 'status_change',
        description: 'Promovido de Novo Convertido para Membro',
        performed_by: userData.user?.id,
        date: new Date().toISOString().split('T')[0],
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-new-converts'] });
      queryClient.invalidateQueries({ queryKey: ['members-all'] });
      toast.success('Novo convertido promovido a membro!');
      setPromoteMember(null);
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const handlePromote = () => {
    if (!promoteMember) return;
    updateMemberType.mutate({
      id: promoteMember.id,
      memberSince: new Date().toISOString().split('T')[0],
    });
  };

  const filteredConverts = newConverts?.filter(c => {
    if (!search) return true;
    return c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
           c.phone?.includes(search) ||
           c.address_city?.toLowerCase().includes(search.toLowerCase());
  });

  const getDaysSinceConversion = (conversionDate: string | null) => {
    if (!conversionDate) return null;
    return differenceInDays(new Date(), new Date(conversionDate));
  };

  // Stats
  const thisMonth = newConverts?.filter(c => {
    if (!c.conversion_date) return false;
    const convDate = new Date(c.conversion_date);
    const now = new Date();
    return convDate.getMonth() === now.getMonth() && convDate.getFullYear() === now.getFullYear();
  }).length || 0;

  const baptized = newConverts?.filter(c => c.baptism_date).length || 0;
  const notBaptized = (newConverts?.length || 0) - baptized;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Novos Convertidos</h1>
        <p className="text-muted-foreground">{newConverts?.length || 0} novos convertidos em acompanhamento</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-500/10">
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{newConverts?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Calendar className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{thisMonth}</p>
                <p className="text-xs text-muted-foreground">Este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Droplets className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{baptized}</p>
                <p className="text-xs text-muted-foreground">Batizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Droplets className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notBaptized}</p>
                <p className="text-xs text-muted-foreground">Aguardando batismo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Lista de Novos Convertidos
          </CardTitle>
          <CardDescription>
            Acompanhe e promova novos convertidos a membros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead>Conversão</TableHead>
                  <TableHead className="hidden md:table-cell">Batismo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConverts?.map((convert) => {
                  const daysSince = getDaysSinceConversion(convert.conversion_date);
                  return (
                    <TableRow key={convert.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={convert.avatar_url || undefined} />
                            <AvatarFallback>
                              {convert.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{convert.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {convert.phone || 'Sem telefone'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {convert.phone ? (
                          <a 
                            href={`https://wa.me/55${convert.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-600 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {convert.phone}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {convert.conversion_date ? (
                            <>
                              <p className="text-sm">
                                {format(new Date(convert.conversion_date), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                              <Badge variant="secondary" className="text-xs">
                                {daysSince} dias
                              </Badge>
                            </>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {convert.baptism_date ? (
                          <Badge className="bg-cyan-500">
                            <Droplets className="w-3 h-3 mr-1" />
                            {format(new Date(convert.baptism_date), "dd/MM/yyyy", { locale: ptBR })}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-600">
                            Aguardando
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => setPromoteMember(convert)}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Promover a Membro
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredConverts?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum novo convertido encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={!!promoteMember} onOpenChange={() => setPromoteMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promover a Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja promover <strong>{promoteMember?.full_name}</strong> para <strong>Membro</strong>?
              <span className="block mt-2 text-sm">
                A data de início como membro será registrada como hoje.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminNewConverts;
