import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, Loader2, User, Mail, Phone, Camera, Calendar as CalendarIcon,
  MapPin, Heart, Droplets, Sparkles, Church, Briefcase, Users
} from "lucide-react";
import { toast } from "sonner";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  gender: string | null;
  profession: string | null;
  address_city: string | null;
  address_state: string | null;
  marital_status: string | null;
  baptism_date: string | null;
  conversion_date: string | null;
  member_since: string | null;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  profession: string;
  address_city: string;
  address_state: string;
  marital_status: string;
  baptism_date: string;
  conversion_date: string;
  member_since: string;
}

const brazilianStates = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const genderOptions = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Prefiro não informar" },
];

const maritalStatusOptions = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
];

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

const formatDateInput = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
};

interface DatePickerFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function DatePickerField({ label, icon, value, onChange, placeholder = "DD/MM/AAAA" }: DatePickerFieldProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value) {
      try {
        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (isValid(date)) {
          setInputValue(format(date, "dd/MM/yyyy"));
        }
      } catch {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setInputValue(formatted);

    if (formatted.length === 10) {
      const parsed = parse(formatted, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        onChange(format(parsed, "yyyy-MM-dd"));
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
      setIsOpen(false);
    }
  };

  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }, [value]);

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
        {icon}
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          maxLength={10}
          className="flex-1 bg-secondary/30 border-0 rounded-xl h-11"
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" type="button" className="h-11 w-11 rounded-xl border-border/50 bg-white shadow-soft">
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              locale={ptBR}
              disabled={(date) => date > new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, loading: authLoading, getTenantPath } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [form, setForm] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    profession: "",
    address_city: "",
    address_state: "",
    marital_status: "",
    baptism_date: "",
    conversion_date: "",
    member_since: "",
  });

  const profileCompleteness = useMemo(() => {
    const fields = [
      form.full_name,
      form.email,
      form.phone,
      form.birth_date,
      form.gender,
      form.profession,
      form.address_city,
      form.address_state,
      form.marital_status,
    ];
    const filledFields = fields.filter(f => f && f.trim() !== "").length;
    return Math.round((filledFields / fields.length) * 100);
  }, [form]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!data && !error) {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || "",
            email: user.email,
          })
          .select()
          .single();

        if (createError) throw createError;
        data = newProfile;
      }

      if (error) throw error;

      setProfile(data);
      setForm({
        full_name: data?.full_name || "",
        email: data?.email || user.email || "",
        phone: data?.phone || "",
        birth_date: data?.birth_date || "",
        gender: data?.gender || "",
        profession: data?.profession || "",
        address_city: data?.address_city || "",
        address_state: data?.address_state || "",
        marital_status: data?.marital_status || "",
        baptism_date: data?.baptism_date || "",
        conversion_date: data?.conversion_date || "",
        member_since: data?.member_since || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name || null,
          email: form.email || null,
          phone: form.phone || null,
          birth_date: form.birth_date || null,
          gender: form.gender || null,
          profession: form.profession || null,
          address_city: form.address_city || null,
          address_state: form.address_state || null,
          marital_status: form.marital_status || null,
          baptism_date: form.baptism_date || null,
          conversion_date: form.conversion_date || null,
          member_since: form.member_since || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...form } : null);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao atualizar perfil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const timestamp = Date.now();
    const filePath = `${user.id}/avatar-${timestamp}.${fileExt}`;

    setUploadingAvatar(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${timestamp}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });

      toast.success("Foto atualizada!");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error("Erro ao enviar foto: " + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setForm(prev => ({ ...prev, phone: formatted }));
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Carregando suas configurações...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 px-4 pb-24 space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-secondary/50">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Configurações</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Seu Perfil Digital</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md sticky top-24">
            <CardContent className="pt-8 flex flex-col items-center text-center">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500">
                  <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="text-3xl font-serif bg-secondary text-foreground">
                    {form.full_name?.charAt(0) || <User className="w-12 h-12" />}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload-main"
                  className={cn(
                    "absolute bottom-0 right-0 p-3 rounded-2xl bg-primary text-white cursor-pointer shadow-soft hover:bg-primary/90 transition-all",
                    uploadingAvatar && "opacity-50 pointer-events-none"
                  )}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </label>
                <input
                  id="avatar-upload-main"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="mt-6 space-y-1">
                <p className="font-bold text-lg leading-snug">{form.full_name || "Membro de Fé"}</p>
                <p className="text-xs text-muted-foreground font-medium">{user?.email}</p>
              </div>

              <div className="w-full mt-8 pt-8 border-t border-border/50 space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  <span>Perfil concluído</span>
                  <span className="text-primary">{profileCompleteness}%</span>
                </div>
                <Progress value={profileCompleteness} className="h-1.5 shadow-inner" />
              </div>

              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="w-full mt-8 rounded-xl h-12 text-[10px] uppercase font-black tracking-widest shadow-soft"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Form */}
        <div className="md:col-span-2 space-y-8 pb-12">
          {/* Dados Pessoais */}
          <section className="space-y-4 animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <User className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-serif font-bold">Informações Básicas</h2>
            </div>
            
            <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md">
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Seu nome"
                    className="bg-secondary/30 border-0 rounded-xl h-11"
                  />
                </div>

                <DatePickerField
                  label="Nascimento"
                  icon={<CalendarIcon className="w-4 h-4" />}
                  value={form.birth_date}
                  onChange={(value) => setForm(prev => ({ ...prev, birth_date: value }))}
                />

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Gênero</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(value) => setForm(prev => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger className="bg-secondary/30 border-0 rounded-xl h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {genderOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Profissão</Label>
                  <Input
                    id="profession"
                    value={form.profession}
                    onChange={(e) => setForm(prev => ({ ...prev, profession: e.target.value }))}
                    placeholder="O que você faz?"
                    className="bg-secondary/30 border-0 rounded-xl h-11"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contato */}
          <section className="space-y-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-secondary/10">
                <Mail className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="text-lg font-serif font-bold">Comunicação</h2>
            </div>
            
            <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md">
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email Pessoal</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-secondary/30 border-0 rounded-xl h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Whatsapp / Celular</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    placeholder="(00) 00000-0000"
                    className="bg-secondary/30 border-0 rounded-xl h-11"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Vida Cristã */}
          <section className="space-y-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-gold/10">
                <Church className="w-5 h-5 text-gold" />
              </div>
              <h2 className="text-lg font-serif font-bold">Jornada de Fé</h2>
            </div>
            
            <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md">
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Estado Civil</Label>
                  <Select
                    value={form.marital_status}
                    onValueChange={(value) => setForm(prev => ({ ...prev, marital_status: value }))}
                  >
                    <SelectTrigger className="bg-secondary/30 border-0 rounded-xl h-11">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      {maritalStatusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DatePickerField
                  label="Batismo"
                  icon={<Droplets className="w-4 h-4 text-primary" />}
                  value={form.baptism_date}
                  onChange={(value) => setForm(prev => ({ ...prev, baptism_date: value }))}
                />

                <DatePickerField
                  label="Conversão"
                  icon={<Sparkles className="w-4 h-4 text-gold" />}
                  value={form.conversion_date}
                  onChange={(value) => setForm(prev => ({ ...prev, conversion_date: value }))}
                />

                <DatePickerField
                  label="Membro Desde"
                  icon={<Church className="w-4 h-4 text-primary" />}
                  value={form.member_since}
                  onChange={(value) => setForm(prev => ({ ...prev, member_since: value }))}
                />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

const Save = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);
