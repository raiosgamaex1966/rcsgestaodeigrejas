import { useState } from "react";
import { useMembers, useBirthdays, useBaptisms, useWeddings } from "@/hooks/useMembers";
import { safeParseDate } from "@/lib/date-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Cake,
  Droplets,
  Heart,
  ChevronLeft,
  ChevronRight,
  Download,
  Phone,
  MessageCircle
} from "lucide-react";
import { format, getDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const AdminBirthdays = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const { data: members, isLoading } = useMembers();

  const birthdays = useBirthdays(selectedMonth);
  const baptisms = useBaptisms(selectedMonth);
  const weddings = useWeddings(selectedMonth);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth(prev => {
      if (direction === 'prev') return prev === 0 ? 11 : prev - 1;
      return prev === 11 ? 0 : prev + 1;
    });
  };

  const exportToWhatsApp = (list: any[], type: string) => {
    if (list.length === 0) {
      toast.error('Nenhum registro para exportar');
      return;
    }

    const header = `📅 *${type} - ${MONTHS[selectedMonth]}*\n\n`;
    const items = list.map(m => {
      const dateStr = type === 'Aniversários' ? m.birth_date :
        type === 'Batismos' ? m.baptism_date : m.wedding_date;
      const parsedDate = safeParseDate(dateStr);
      const day = parsedDate ? getDate(parsedDate) : '?';
      return `• Dia ${day}: ${m.full_name}`;
    }).join('\n');

    const text = encodeURIComponent(header + items);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    toast.success('Lista copiada para WhatsApp!');
  };

  const exportCSV = (list: any[], type: string) => {
    if (list.length === 0) {
      toast.error('Nenhum registro para exportar');
      return;
    }

    const headers = ['Dia', 'Nome', 'Telefone'];
    const rows = list.map(m => {
      const dateStr = type === 'Aniversários' ? m.birth_date :
        type === 'Batismos' ? m.baptism_date : m.wedding_date;
      const parsedDate = safeParseDate(dateStr);
      const day = parsedDate ? getDate(parsedDate) : '';
      return [day, m.full_name || '', m.phone || ''];
    });

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type.toLowerCase()}-${MONTHS[selectedMonth].toLowerCase()}.csv`;
    a.click();
    toast.success('Lista exportada!');
  };

  const renderList = (list: any[], dateField: string, type: string) => (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => exportToWhatsApp(list, type)}>
          <MessageCircle className="w-4 h-4 mr-2" />
          WhatsApp
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportCSV(list, type)}>
          <Download className="w-4 h-4 mr-2" />
          CSV
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        {list.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum registro em {MONTHS[selectedMonth]}
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((member) => {
              const dateStr = member[dateField];
              const parsedDate = safeParseDate(dateStr);
              const day = parsedDate ? getDate(parsedDate) : null;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{day}</span>
                  </div>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.full_name}</p>
                    {member.phone && (
                      <a
                        href={`https://wa.me/55${member.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {member.phone}
                      </a>
                    )}
                  </div>
                  <Badge variant="outline">
                    {parsedDate ? format(parsedDate, "dd 'de' MMMM", { locale: ptBR }) : '-'}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aniversários</h1>
          <p className="text-muted-foreground">Calendário de datas comemorativas</p>
        </div>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Cake className="w-3 h-3" />
                {birthdays.length} aniversários
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Droplets className="w-3 h-3" />
                {baptisms.length} batismos
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <Heart className="w-3 h-3" />
                {weddings.length} casamentos
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Datas Comemorativas</CardTitle>
          <CardDescription>
            {MONTHS[selectedMonth]} - Aniversários, Batismos e Casamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="birthdays">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="birthdays" className="gap-2">
                <Cake className="w-4 h-4" />
                Aniversários
              </TabsTrigger>
              <TabsTrigger value="baptisms" className="gap-2">
                <Droplets className="w-4 h-4" />
                Batismos
              </TabsTrigger>
              <TabsTrigger value="weddings" className="gap-2">
                <Heart className="w-4 h-4" />
                Casamentos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="birthdays" className="mt-6">
              {renderList(birthdays, 'birth_date', 'Aniversários')}
            </TabsContent>

            <TabsContent value="baptisms" className="mt-6">
              {renderList(baptisms, 'baptism_date', 'Batismos')}
            </TabsContent>

            <TabsContent value="weddings" className="mt-6">
              {renderList(weddings, 'wedding_date', 'Casamentos')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBirthdays;
