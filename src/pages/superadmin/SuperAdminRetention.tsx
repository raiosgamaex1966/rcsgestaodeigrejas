import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Users, UserMinus, UserPlus, Activity, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RetentionData {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  total_members: number;
  active_members: number;
  inactive_members: number;
  recent_joins: number; // joined in last 30 days
  retention_rate: number;
}

const SuperAdminRetention = () => {
  const [data, setData] = useState<RetentionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchRetention = async () => {
      setLoading(true);

      // 1. Fetch all tenants
      const { data: tenants } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("is_active", true);

      // 2. Fetch all profiles mapped to those tenants
      const { data: profiles } = await supabase
        .from("profiles")
        .select("tenant_id, is_active, created_at");

      if (tenants && profiles) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stats = tenants.map((tenant) => {
          const tenantProfiles = profiles.filter((p) => p.tenant_id === tenant.id);
          const total_members = tenantProfiles.length;
          const active_members = tenantProfiles.filter((p) => p.is_active).length;
          const inactive_members = total_members - active_members;
          const recent_joins = tenantProfiles.filter(
            (p) => new Date(p.created_at) >= thirtyDaysAgo
          ).length;

          const retention_rate = total_members > 0 
            ? Math.round((active_members / total_members) * 100) 
            : 0;

          return {
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            tenant_slug: tenant.slug,
            total_members,
            active_members,
            inactive_members,
            recent_joins,
            retention_rate,
          };
        });

        // Sort by lowest retention rate to highlight problems
        stats.sort((a, b) => a.retention_rate - b.retention_rate);
        setData(stats);
      }
      setLoading(false);
    };

    fetchRetention();
  }, []);

  const filteredData = data.filter(
    (d) =>
      d.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tenant_slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGlobalMembers = data.reduce((acc, curr) => acc + curr.total_members, 0);
  const totalGlobalInactive = data.reduce((acc, curr) => acc + curr.inactive_members, 0);
  const globalRetention = totalGlobalMembers > 0 ? Math.round(((totalGlobalMembers - totalGlobalInactive) / totalGlobalMembers) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          Retenção de Membros
        </h1>
        <p className="text-muted-foreground mt-1">
          Analise o engajamento e a taxa de inatividade por congregação
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Global (Base)</p>
                <h3 className="text-2xl font-bold text-primary">{totalGlobalMembers}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-full">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground text-emerald-800">Retenção Média Geral</p>
                <h3 className="text-2xl font-bold text-emerald-700">{globalRetention}%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <UserMinus className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground text-red-800">Total Inativos</p>
                <h3 className="text-2xl font-bold text-red-700">{totalGlobalInactive}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Análise por Igreja</CardTitle>
              <CardDescription>Identifique igrejas com alto índice de inatividade</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar igreja..."
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
                <TableHead>Igreja</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center hidden md:table-cell">Ativos</TableHead>
                <TableHead className="text-center">Inativos</TableHead>
                <TableHead className="text-center hidden lg:table-cell">Novos (30d)</TableHead>
                <TableHead className="text-center">Taxa de Retenção</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Activity className="w-6 h-6 animate-pulse mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Calculando dados de retenção...</p>
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhum dado encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((d) => (
                  <TableRow key={d.tenant_id}>
                    <TableCell>
                      <div className="font-medium text-sm">{d.tenant_name}</div>
                      <div className="text-xs text-muted-foreground">{d.tenant_slug}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-medium">{d.total_members}</Badge>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      {d.active_members}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={d.inactive_members > 0 ? "text-red-500 font-medium" : ""}>
                        {d.inactive_members}
                      </span>
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      <span className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-medium">
                        {d.recent_joins > 0 && <UserPlus className="w-3 h-3" />}
                        {d.recent_joins}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-sm font-bold ${
                          d.retention_rate < 50 ? "text-red-600" : 
                          d.retention_rate < 80 ? "text-amber-600" : "text-emerald-600"
                        }`}>
                          {d.retention_rate}%
                        </span>
                        {d.retention_rate < 50 && (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                      </div>
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

export default SuperAdminRetention;
