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
import { UserPlus, Search, Phone, Heart, UserCheck, Calendar } from "lucide-react";
import { toast } from "sonner";
import { MemberProfile } from "@/hooks/useMembers";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminVisitors = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [convertMember, setConvertMember] = useState<MemberProfile | null>(null);
  const [convertType, setConvertType] = useState<'novo_convertido' | 'membro'>('novo_convertido');

  const { data: visitors, isLoading } = useQuery({
    queryKey: ['admin-visitors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('member_type', 'visitante')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MemberProfile[];
    },
  });

  const updateMemberType = useMutation({
    mutationFn: async ({ id, type, conversionDate, memberName }: { id: string; type: string; conversionDate?: string; memberName?: string }) => {
      const updates: Record<string, string> = { member_type: type };
      if (conversionDate) {
        updates.conversion_date = conversionDate;
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
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
        description: `Alterado de visitante para ${type === 'novo_convertido' ? 'Novo Convertido' : 'Membro'}`,
        performed_by: userData.user?.id,
        date: new Date().toISOString().split('T')[0],
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-visitors'] });
      queryClient.invalidateQueries({ queryKey: ['members-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-new-converts'] });
      toast.success('Visitante convertido com sucesso!');
      setConvertMember(null);
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const handleConvert = () => {
    if (!convertMember) return;
    updateMemberType.mutate({
      id: convertMember.id,
      type: convertType,
      conversionDate: convertType === 'novo_convertido' ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const filteredVisitors = visitors?.filter(v => {
    if (!search) return true;
    return v.full_name?.toLowerCase().includes(search.toLowerCase()) ||
           v.phone?.includes(search) ||
           v.address_city?.toLowerCase().includes(search.toLowerCase());
  });

  const getDaysSinceRegistration = (createdAt: string) => {
    return differenceInDays(new Date(), new Date(createdAt));
  };

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
        <h1 className="text-2xl font-bold text-foreground">Visitantes</h1>
        <p className="text-muted-foreground">{visitors?.length || 0} visitantes cadastrados</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <UserPlus className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{visitors?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total de Visitantes</p>
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
                <p className="text-2xl font-bold">
                  {visitors?.filter(v => getDaysSinceRegistration(v.created_at) <= 7).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {visitors?.filter(v => getDaysSinceRegistration(v.created_at) <= 30).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
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
            <UserPlus className="w-5 h-5" />
            Lista de Visitantes
          </CardTitle>
          <CardDescription>
            Converta visitantes em novos convertidos ou membros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visitante</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                  <TableHead className="hidden md:table-cell">Cidade</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors?.map((visitor) => {
                  const daysSince = getDaysSinceRegistration(visitor.created_at);
                  return (
                    <TableRow key={visitor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={visitor.avatar_url || undefined} />
                            <AvatarFallback>
                              {visitor.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{visitor.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {visitor.phone || 'Sem telefone'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {visitor.phone ? (
                          <a 
                            href={`https://wa.me/55${visitor.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-600 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {visitor.phone}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {visitor.address_city || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={daysSince <= 7 ? "default" : daysSince <= 30 ? "secondary" : "outline"}>
                          {daysSince} dias
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setConvertMember(visitor);
                              setConvertType('novo_convertido');
                            }}
                          >
                            <Heart className="w-4 h-4 mr-1" />
                            Convertido
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setConvertMember(visitor);
                              setConvertType('membro');
                            }}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Membro
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredVisitors?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum visitante encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={!!convertMember} onOpenChange={() => setConvertMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Conversão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja converter <strong>{convertMember?.full_name}</strong> para{' '}
              <strong>{convertType === 'novo_convertido' ? 'Novo Convertido' : 'Membro'}</strong>?
              {convertType === 'novo_convertido' && (
                <span className="block mt-2 text-sm">
                  A data de conversão será registrada como hoje.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVisitors;
