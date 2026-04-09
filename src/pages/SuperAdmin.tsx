import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Church, Users, CreditCard, ShieldAlert, CheckCircle2, XCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  tax_id: string | null;
  subscription_status: string;
  subscription_ends_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
}

const SuperAdmin = () => {
  const { userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!authLoading && userRole !== 'owner') {
      navigate("/");
    }
  }, [userRole, authLoading, navigate]);

  const fetchTenants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao buscar igrejas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTenants(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (userRole === 'owner') {
      fetchTenants();
    }
  }, [userRole]);

  const handleToggleStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === "blocked" ? "active" : "blocked";
    
    const { error } = await supabase
      .from("tenants")
      .update({ subscription_status: newStatus })
      .eq("id", tenantId);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status atualizado",
        description: `Igreja ${newStatus === "blocked" ? "bloqueada" : "ativada"} com sucesso.`,
      });
      fetchTenants();
    }
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, trialEnds: string | null) => {
    const isExpired = trialEnds && new Date(trialEnds) < new Date();
    
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Ativa</Badge>;
      case "blocked":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Bloqueada</Badge>;
      case "trial":
        return (
          <Badge variant={isExpired ? "destructive" : "secondary"}>
            {isExpired ? "Teste Expirado" : "Em Teste"}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || userRole !== 'owner') {
    return null; // Ou um spinner de carregamento, ou uma mensagem de acesso negado
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif">Painel do Proprietário</h1>
          <p className="text-muted-foreground text-lg">Visão geral do ecossistema RCS Gestão</p>
        </div>
        <div className="flex gap-4">
          <Card className="p-4 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Church className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold">Total de Igrejas</p>
              <p className="text-xl font-bold">{tenants.length}</p>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Lista de Igrejas
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar igreja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Igreja</TableHead>
                <TableHead>Documento (CNPJ/CPF)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fim do Teste / Contrato</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma igreja encontrada.</TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{t.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{t.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell>{t.tax_id || "Não informado"}</TableCell>
                    <TableCell>
                      {getStatusBadge(t.subscription_status, t.trial_ends_at)}
                    </TableCell>
                    <TableCell>
                      {t.subscription_status === "trial" 
                        ? new Date(t.trial_ends_at || "").toLocaleDateString()
                        : t.subscription_ends_at 
                          ? new Date(t.subscription_ends_at).toLocaleDateString()
                          : "N/A"
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={t.subscription_status === "blocked" ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => handleToggleStatus(t.id, t.subscription_status)}
                        className="gap-2"
                      >
                        {t.subscription_status === "blocked" ? (
                          <><CheckCircle2 className="w-4 h-4" /> Desbloquear</>
                        ) : (
                          <><ShieldAlert className="w-4 h-4" /> Bloquear</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdmin;
