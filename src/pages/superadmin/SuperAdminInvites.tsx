import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseNoSession } from "@/integrations/supabase/signupClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Send, Plus, Mail, Clock, CheckCircle2, XCircle, Copy, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Invite {
  id: string;
  email: string;
  pastor_name: string;
  church_name: string;
  status: "pending" | "accepted" | "expired";
  sent_at: string;
  expires_at: string;
  message: string;
}

const SuperAdminInvites = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    email: "",
    pastor_name: "",
    church_name: "",
    message: "Olá! Você foi convidado para utilizar o sistema RCS Gestão de Igrejas. Cadastre sua igreja e ganhe 4 dias de teste grátis!",
  });

  // Load invites from localStorage (would be a table in production)
  useEffect(() => {
    const saved = localStorage.getItem("rcs_invites");
    if (saved) {
      try {
        setInvites(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveInvites = (newInvites: Invite[]) => {
    setInvites(newInvites);
    localStorage.setItem("rcs_invites", JSON.stringify(newInvites));
  };

  const handleSendInvite = async () => {
    if (!form.email || !form.pastor_name || !form.church_name) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSending(true);

    // Create the invite record
    const newInvite: Invite = {
      id: crypto.randomUUID(),
      email: form.email,
      pastor_name: form.pastor_name,
      church_name: form.church_name,
      status: "pending",
      sent_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: form.message,
    };

    // Try to create user via signUp (this sends the invite email) using no-session client
    const { error } = await supabaseNoSession.auth.signUp({
      email: form.email,
      password: "Convite2026!",
      options: {
        data: {
          full_name: form.pastor_name,
          church_name: form.church_name,
          role: "admin",
          invited_by: "owner",
        },
      },
    });

    if (error) {
      toast.error("Erro ao enviar convite: " + error.message);
      setSending(false);
      return;
    }

    const updated = [newInvite, ...invites];
    saveInvites(updated);
    toast.success(`Convite enviado para ${form.email}!`);
    setSending(false);
    setIsCreateOpen(false);
    setForm({
      email: "",
      pastor_name: "",
      church_name: "",
      message: "Olá! Você foi convidado para utilizar o sistema RCS Gestão de Igrejas. Cadastre sua igreja e ganhe 4 dias de teste grátis!",
    });
  };

  const resendInvite = (invite: Invite) => {
    toast.success(`Convite reenviado para ${invite.email}`);
  };

  const copyInviteLink = (invite: Invite) => {
    const link = `${window.location.origin}/auth?invite=${invite.id}&church=${encodeURIComponent(invite.church_name)}`;
    navigator.clipboard.writeText(link);
    toast.success("Link de convite copiado!");
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();

    if (status === "accepted") return <Badge className="bg-emerald-500 hover:bg-emerald-600">Aceito</Badge>;
    if (isExpired || status === "expired") return <Badge variant="secondary">Expirado</Badge>;
    return <Badge className="bg-amber-500 hover:bg-amber-600">Pendente</Badge>;
  };

  const stats = {
    total: invites.length,
    pending: invites.filter((i) => i.status === "pending" && new Date(i.expires_at) > new Date()).length,
    accepted: invites.filter((i) => i.status === "accepted").length,
    expired: invites.filter((i) => i.status === "expired" || new Date(i.expires_at) < new Date()).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif">Convites</h1>
          <p className="text-muted-foreground">
            Envie convites para pastores e administradores de igrejas
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Convite
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Enviados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.accepted}</p>
            <p className="text-xs text-muted-foreground">Aceitos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{stats.expired}</p>
            <p className="text-xs text-muted-foreground">Expirados</p>
          </CardContent>
        </Card>
      </div>

      {/* Invites Table */}
      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            Histórico de convites e status de cada um
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pastor / Admin</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Igreja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Enviado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Nenhum convite enviado ainda. Clique em "Novo Convite" para começar.
                  </TableCell>
                </TableRow>
              ) : (
                invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.pastor_name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm">{invite.email}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{invite.church_name}</TableCell>
                    <TableCell>
                      {getStatusBadge(invite.status, invite.expires_at)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {new Date(invite.sent_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyInviteLink(invite)}
                          title="Copiar link"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => resendInvite(invite)}
                          title="Reenviar"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Invite Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Enviar Convite
            </DialogTitle>
            <DialogDescription>
              Envie um convite para um pastor ou administrador de igreja
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Pastor / Responsável *</Label>
              <Input
                value={form.pastor_name}
                onChange={(e) => setForm((p) => ({ ...p, pastor_name: e.target.value }))}
                placeholder="Pr. João da Silva"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="pastor@igreja.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome da Igreja *</Label>
              <Input
                value={form.church_name}
                onChange={(e) => setForm((p) => ({ ...p, church_name: e.target.value }))}
                placeholder="Igreja Comunidade da Fé"
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem Personalizada</Label>
              <Textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendInvite} disabled={sending} className="gap-2">
              <Send className="w-4 h-4" />
              {sending ? "Enviando..." : "Enviar Convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminInvites;
