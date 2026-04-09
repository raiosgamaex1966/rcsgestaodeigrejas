import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Database, Search, Shield, User, Church, Settings, Activity } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  tenant_id: string | null;
  details: any;
  created_at: string;
  user_email?: string;
  tenant_name?: string;
}

const SuperAdminAudit = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      // Fetch logs
      const { data: logsData } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (logsData) {
        // Fetch related user emails and tenant names if possible
        // For a real SaaS, doing joins is better, but here we'll just show IDs or fetch a map
        const userIds = [...new Set(logsData.map(l => l.user_id).filter(Boolean))];
        const tenantIds = [...new Set(logsData.map(l => l.tenant_id).filter(Boolean))];

        let userMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("id, email").in("id", userIds);
          userMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p.email }), {} as Record<string, string>);
        }

        let tenantMap: Record<string, string> = {};
        if (tenantIds.length > 0) {
          const { data: tenants } = await supabase.from("tenants").select("id, name").in("id", tenantIds);
          tenantMap = (tenants || []).reduce((acc, t) => ({ ...acc, [t.id]: t.name }), {} as Record<string, string>);
        }

        const enriched = logsData.map(l => ({
          ...l,
          user_email: l.user_id ? userMap[l.user_id] : "Sistema",
          tenant_name: l.tenant_id ? tenantMap[l.tenant_id] : "Global",
        }));
        
        setLogs(enriched);
      }
      setLoading(false);
    };

    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.user_email && l.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("activate")) return "bg-emerald-100 text-emerald-800";
    if (action.includes("delete") || action.includes("block")) return "bg-red-100 text-red-800";
    if (action.includes("update") || action.includes("edit")) return "bg-blue-100 text-blue-800";
    return "bg-slate-100 text-slate-800";
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "tenant": return <Church className="w-4 h-4" />;
      case "user": return <User className="w-4 h-4" />;
      case "settings": return <Settings className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Logs de Auditoria
        </h1>
        <p className="text-muted-foreground mt-1">
          Registro de todas as ações importantes no sistema (Compliance LGPD)
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Histórico de Eventos</CardTitle>
              <CardDescription>Visualizando os últimos 100 registros do sistema</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead className="hidden md:table-cell">Workspace</TableHead>
                <TableHead className="hidden lg:table-cell">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Activity className="w-6 h-6 animate-pulse mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Carregando logs...</p>
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{log.user_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-none ${getActionColor(log.action)}`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        {getEntityIcon(log.entity_type)}
                        <span className="capitalize">{log.entity_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {log.tenant_name}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs font-mono text-muted-foreground">
                      {log.details ? JSON.stringify(log.details).substring(0, 50) + (JSON.stringify(log.details).length > 50 ? "..." : "") : "N/A"}
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

export default SuperAdminAudit;
