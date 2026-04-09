import { useState } from "react";
import { usePendingMembers, useBulkApproveMembers } from "@/hooks/useMembers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  UserCheck, 
  Search, 
  MapPin, 
  Clock, 
  CheckSquare,
  Square
} from "lucide-react";
import { toast } from "sonner";

const AdminMemberApprovals = () => {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { data: pendingMembers, isLoading } = usePendingMembers();
  const bulkApprove = useBulkApproveMembers();

  const filteredMembers = pendingMembers?.filter(m => 
    !search || 
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === (filteredMembers?.length || 0)) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMembers?.map(m => m.id) || []);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      await bulkApprove.mutateAsync(selectedIds);
      setSelectedIds([]);
    } catch (error) {
      // toast já tratado no hook
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pt-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Aprovação de Membros</h1>
          <p className="text-muted-foreground">Solicitações de entrada aguardando autorização</p>
        </div>
        {selectedIds.length > 0 && (
          <Button 
            className="bg-primary hover:bg-primary/90 shadow-md animate-in fade-in slide-in-from-right-4"
            onClick={handleBulkApprove}
            disabled={bulkApprove.isPending}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Aprovar {selectedIds.length} Selecionados
          </Button>
        )}
      </div>

      <Card className="border-primary/10">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar solicitações por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Solicitações Pendentes ({filteredMembers?.length || 0})
            </CardTitle>
            {filteredMembers && filteredMembers.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSelectAll}
                className="text-primary hover:bg-primary/10"
              >
                {selectedIds.length === filteredMembers.length ? (
                  <><CheckSquare className="w-4 h-4 mr-2" /> Desmarcar Todos</>
                ) : (
                  <><Square className="w-4 h-4 mr-2" /> Marcar Todos</>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Membro</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Cidade/Localização</TableHead>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers?.map((member) => (
                  <TableRow 
                    key={member.id} 
                    className={selectedIds.includes(member.id) ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(member.id)}
                        onCheckedChange={() => toggleSelect(member.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary/10">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/5 text-primary font-bold">
                            {member.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-foreground">{member.full_name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{member.phone || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {member.address_city || 'Não informado'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => bulkApprove.mutate([member.id])}
                      >
                        Aprovar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!filteredMembers || filteredMembers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-serif italic">
                      Nenhuma solicitação de acesso pendente no momento.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in slide-in-from-bottom-10">
          <Card className="bg-primary text-primary-foreground shadow-2xl px-6 py-3 flex items-center gap-6 rounded-full border-none">
            <span className="font-bold whitespace-nowrap">{selectedIds.length} membros selecionados</span>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white text-primary hover:bg-white/90 rounded-full font-bold px-6"
                onClick={handleBulkApprove}
              >
                Aprovar Agora
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/10 rounded-full"
                onClick={() => setSelectedIds([])}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminMemberApprovals;
