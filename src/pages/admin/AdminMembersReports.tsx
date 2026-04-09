import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Download, FileSpreadsheet, FileText, Users, TrendingUp,
  MapPin, Calendar, Heart, UserCheck, Cake
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MemberProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  birth_date: string | null;
  marital_status: string | null;
  member_type: string | null;
  member_since: string | null;
  baptism_date: string | null;
  conversion_date: string | null;
  address_city: string | null;
  address_state: string | null;
  is_active: boolean | null;
  created_at: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00C49F"
];

const memberTypeLabels: Record<string, string> = {
  visitante: "Visitante",
  novo_convertido: "Novo Convertido",
  membro: "Membro",
  lider: "Líder",
  pastor: "Pastor"
};

const genderLabels: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro"
};

const maritalLabels: Record<string, string> = {
  solteiro: "Solteiro(a)",
  casado: "Casado(a)",
  divorciado: "Divorciado(a)",
  viuvo: "Viúvo(a)",
  uniao_estavel: "União Estável"
};

export default function AdminMembersReports() {
  const [period, setPeriod] = useState<string>("12");
  const [reportType, setReportType] = useState<string>("growth");

  // Fetch all members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-members-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MemberProfile[];
    }
  });

  // Calculate age from birth date
  const getAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Get age group
  const getAgeGroup = (age: number | null): string => {
    if (age === null) return "Não informado";
    if (age < 18) return "0-17";
    if (age < 26) return "18-25";
    if (age < 36) return "26-35";
    if (age < 46) return "36-45";
    if (age < 56) return "46-55";
    if (age < 66) return "56-65";
    return "65+";
  };

  // Growth data (members by month)
  const growthData = useMemo(() => {
    const months = parseInt(period);
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const newMembers = members.filter(m => {
        if (!m.created_at) return false;
        const createdAt = parseISO(m.created_at);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      }).length;

      const baptisms = members.filter(m => {
        if (!m.baptism_date) return false;
        const baptismDate = parseISO(m.baptism_date);
        return isWithinInterval(baptismDate, { start: monthStart, end: monthEnd });
      }).length;

      const conversions = members.filter(m => {
        if (!m.conversion_date) return false;
        const conversionDate = parseISO(m.conversion_date);
        return isWithinInterval(conversionDate, { start: monthStart, end: monthEnd });
      }).length;

      data.push({
        month: format(date, "MMM/yy", { locale: ptBR }),
        cadastros: newMembers,
        batismos: baptisms,
        conversoes: conversions
      });
    }
    
    return data;
  }, [members, period]);

  // Cumulative growth data
  const cumulativeData = useMemo(() => {
    const months = parseInt(period);
    const data = [];
    let total = 0;
    
    // Count members before the period
    const periodStart = subMonths(new Date(), months);
    total = members.filter(m => {
      if (!m.created_at) return false;
      return parseISO(m.created_at) < periodStart;
    }).length;
    
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const newMembers = members.filter(m => {
        if (!m.created_at) return false;
        const createdAt = parseISO(m.created_at);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      }).length;

      total += newMembers;

      data.push({
        month: format(date, "MMM/yy", { locale: ptBR }),
        total
      });
    }
    
    return data;
  }, [members, period]);

  // Gender distribution
  const genderData = useMemo(() => {
    const distribution: Record<string, number> = {};
    members.forEach(m => {
      const gender = m.gender || "nao_informado";
      distribution[gender] = (distribution[gender] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name: genderLabels[name] || "Não informado",
      value
    }));
  }, [members]);

  // Age distribution
  const ageData = useMemo(() => {
    const distribution: Record<string, number> = {
      "0-17": 0,
      "18-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-55": 0,
      "56-65": 0,
      "65+": 0,
      "Não informado": 0
    };
    members.forEach(m => {
      const age = getAge(m.birth_date);
      const group = getAgeGroup(age);
      distribution[group] = (distribution[group] || 0) + 1;
    });
    return Object.entries(distribution)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [members]);

  // Marital status distribution
  const maritalData = useMemo(() => {
    const distribution: Record<string, number> = {};
    members.forEach(m => {
      const status = m.marital_status || "nao_informado";
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name: maritalLabels[name] || "Não informado",
      value
    }));
  }, [members]);

  // Member type distribution
  const memberTypeData = useMemo(() => {
    const distribution: Record<string, number> = {};
    members.forEach(m => {
      const type = m.member_type || "visitante";
      distribution[type] = (distribution[type] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({
      name: memberTypeLabels[name] || name,
      value
    }));
  }, [members]);

  // City distribution (top 10)
  const cityData = useMemo(() => {
    const distribution: Record<string, number> = {};
    members.forEach(m => {
      const city = m.address_city || "Não informado";
      distribution[city] = (distribution[city] || 0) + 1;
    });
    return Object.entries(distribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  }, [members]);

  // Stats
  const stats = useMemo(() => {
    const activeMembers = members.filter(m => m.is_active !== false);
    const baptized = members.filter(m => m.baptism_date);
    const converted = members.filter(m => m.conversion_date);
    const withBirthdate = members.filter(m => m.birth_date);
    
    return {
      total: members.length,
      active: activeMembers.length,
      baptized: baptized.length,
      converted: converted.length,
      withBirthdate: withBirthdate.length,
      completeness: Math.round((withBirthdate.length / members.length) * 100) || 0
    };
  }, [members]);

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.text("Relatório de Membros", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, pageWidth / 2, 28, { align: "center" });

    // Stats summary
    doc.setFontSize(14);
    doc.text("Resumo Geral", 14, 40);
    
    autoTable(doc, {
      startY: 45,
      head: [["Métrica", "Valor"]],
      body: [
        ["Total de Cadastros", stats.total.toString()],
        ["Membros Ativos", stats.active.toString()],
        ["Batizados", stats.baptized.toString()],
        ["Convertidos", stats.converted.toString()],
        ["Completude dos Dados", `${stats.completeness}%`]
      ],
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] }
    });

    // Gender distribution
    let yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    doc.text("Distribuição por Gênero", 14, yPos);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Gênero", "Quantidade", "%"]],
      body: genderData.map(item => [
        item.name,
        item.value.toString(),
        `${((item.value / stats.total) * 100).toFixed(1)}%`
      ]),
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] }
    });

    // Age distribution
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    doc.text("Distribuição por Faixa Etária", 14, yPos);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Faixa Etária", "Quantidade", "%"]],
      body: ageData.map(item => [
        item.name,
        item.value.toString(),
        `${((item.value / stats.total) * 100).toFixed(1)}%`
      ]),
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] }
    });

    // Member type distribution
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.text("Distribuição por Tipo", 14, yPos);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Tipo", "Quantidade", "%"]],
      body: memberTypeData.map(item => [
        item.name,
        item.value.toString(),
        `${((item.value / stats.total) * 100).toFixed(1)}%`
      ]),
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] }
    });

    // Top cities
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    doc.text("Top 10 Cidades", 14, yPos);
    
    autoTable(doc, {
      startY: yPos + 5,
      head: [["Cidade", "Quantidade", "%"]],
      body: cityData.map(item => [
        item.name,
        item.value.toString(),
        `${((item.value / stats.total) * 100).toFixed(1)}%`
      ]),
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] }
    });

    doc.save(`relatorio-membros-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  // Export to Excel (CSV)
  const exportToExcel = () => {
    // Create CSV content
    let csv = "Relatório de Membros\n\n";
    csv += `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}\n\n`;
    
    // Summary
    csv += "RESUMO GERAL\n";
    csv += "Métrica,Valor\n";
    csv += `Total de Cadastros,${stats.total}\n`;
    csv += `Membros Ativos,${stats.active}\n`;
    csv += `Batizados,${stats.baptized}\n`;
    csv += `Convertidos,${stats.converted}\n`;
    csv += `Completude dos Dados,${stats.completeness}%\n\n`;

    // Gender
    csv += "DISTRIBUIÇÃO POR GÊNERO\n";
    csv += "Gênero,Quantidade,%\n";
    genderData.forEach(item => {
      csv += `${item.name},${item.value},${((item.value / stats.total) * 100).toFixed(1)}%\n`;
    });
    csv += "\n";

    // Age
    csv += "DISTRIBUIÇÃO POR FAIXA ETÁRIA\n";
    csv += "Faixa Etária,Quantidade,%\n";
    ageData.forEach(item => {
      csv += `${item.name},${item.value},${((item.value / stats.total) * 100).toFixed(1)}%\n`;
    });
    csv += "\n";

    // Member Type
    csv += "DISTRIBUIÇÃO POR TIPO\n";
    csv += "Tipo,Quantidade,%\n";
    memberTypeData.forEach(item => {
      csv += `${item.name},${item.value},${((item.value / stats.total) * 100).toFixed(1)}%\n`;
    });
    csv += "\n";

    // Marital Status
    csv += "DISTRIBUIÇÃO POR ESTADO CIVIL\n";
    csv += "Estado Civil,Quantidade,%\n";
    maritalData.forEach(item => {
      csv += `${item.name},${item.value},${((item.value / stats.total) * 100).toFixed(1)}%\n`;
    });
    csv += "\n";

    // Cities
    csv += "TOP 10 CIDADES\n";
    csv += "Cidade,Quantidade,%\n";
    cityData.forEach(item => {
      csv += `${item.name},${item.value},${((item.value / stats.total) * 100).toFixed(1)}%\n`;
    });
    csv += "\n";

    // Growth data
    csv += "CRESCIMENTO MENSAL\n";
    csv += "Mês,Cadastros,Batismos,Conversões\n";
    growthData.forEach(item => {
      csv += `${item.month},${item.cadastros},${item.batismos},${item.conversoes}\n`;
    });

    // Download
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-membros-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/members">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Relatórios de Membros</h1>
            <p className="text-muted-foreground">Análises demográficas e de crescimento</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
              <SelectItem value="24">24 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Heart className="h-6 w-6 mx-auto text-pink-500 mb-2" />
            <p className="text-2xl font-bold">{stats.baptized}</p>
            <p className="text-xs text-muted-foreground">Batizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{stats.converted}</p>
            <p className="text-xs text-muted-foreground">Convertidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Cake className="h-6 w-6 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{stats.withBirthdate}</p>
            <p className="text-xs text-muted-foreground">Com Nascimento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Download className="h-6 w-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{stats.completeness}%</p>
            <p className="text-xs text-muted-foreground">Completude</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="demographics">Demografia</TabsTrigger>
          <TabsTrigger value="types">Perfil</TabsTrigger>
          <TabsTrigger value="location">Localização</TabsTrigger>
        </TabsList>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Crescimento Acumulado</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                      name="Total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Novos Cadastros por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cadastros" fill="hsl(var(--primary))" name="Cadastros" />
                    <Bar dataKey="batismos" fill="hsl(var(--chart-2))" name="Batismos" />
                    <Bar dataKey="conversoes" fill="hsl(var(--chart-3))" name="Conversões" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolução Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cadastros" stroke="hsl(var(--primary))" name="Cadastros" strokeWidth={2} />
                  <Line type="monotone" dataKey="batismos" stroke="hsl(var(--chart-2))" name="Batismos" strokeWidth={2} />
                  <Line type="monotone" dataKey="conversoes" stroke="hsl(var(--chart-3))" name="Conversões" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics Tab */}
        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição por Gênero</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição por Faixa Etária</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Estado Civil</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={maritalData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {maritalData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição por Tipo de Membro</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={memberTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {memberTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quantidade por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={memberTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Quantidade">
                      {memberTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Top 10 Cidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={cityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="Quantidade">
                    {cityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
