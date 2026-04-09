import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
    Save, Loader2, Star, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

const genderOptions = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Feminino' },
    { value: 'O', label: 'Outro' },
];

const maritalStatusOptions = [
    { value: 'Solteiro', label: 'Solteiro(a)' },
    { value: 'Casado', label: 'Casado(a)' },
    { value: 'Viúvo', label: 'Viúvo(a)' },
    { value: 'Divorciado', label: 'Divorciado(a)' },
];

const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
];

export default function BecomeMember() {
    const { user, getTenantPath } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<any>({
        full_name: '',
        email: '',
        phone: '',
        birth_date: '',
        gender: '',
        marital_status: '',
        profession: '',
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        address_zip: '',
        notes: '',
    });

    useEffect(() => {
        if (!user) {
            navigate('/auth');
            return;
        }

        const fetchProfile = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setFormData({
                    ...formData,
                    ...data,
                    email: user.email // Garante o email do auth
                });
            }
            setLoading(false);
        };

        fetchProfile();
    }, [user, navigate]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    ...formData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Perfil atualizado com sucesso! Agora um administrador poderá revisar sua solicitação de membro.');
            navigate(getTenantPath('/'));
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium animate-pulse">Carregando formulário...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-24 animate-fade-in">
            <header className="mb-8 space-y-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate(-1)}
                    className="rounded-full bg-secondary/50"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl shadow-soft">
                        <Star className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Torne-se Membro</h1>
                        <p className="text-sm text-muted-foreground">Formalize sua caminhada conosco</p>
                    </div>
                </div>
            </header>

            <Card className="border-border/50 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden rounded-3xl">
                <CardContent className="p-0">
                    <Tabs defaultValue="personal" className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b bg-secondary/30 h-14 px-4 gap-2">
                            <TabsTrigger value="personal" className="data-[state=active]:bg-white data-[state=active]:shadow-soft rounded-lg text-[10px] uppercase font-black tracking-widest px-4">Pessoal</TabsTrigger>
                            <TabsTrigger value="address" className="data-[state=active]:bg-white data-[state=active]:shadow-soft rounded-lg text-[10px] uppercase font-black tracking-widest px-4">Endereço</TabsTrigger>
                            <TabsTrigger value="more" className="data-[state=active]:bg-white data-[state=active]:shadow-soft rounded-lg text-[10px] uppercase font-black tracking-widest px-4">Extra</TabsTrigger>
                        </TabsList>

                        <div className="p-6 md:p-8">
                            <TabsContent value="personal" className="space-y-6 mt-0 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Completo</Label>
                                        <Input
                                            value={formData.full_name}
                                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            className="bg-secondary/50 border-0 rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email (Vinculado)</Label>
                                        <Input value={formData.email} disabled className="bg-muted/50 border-0 rounded-xl h-11 cursor-not-allowed opacity-60" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telefone (Whatsapp)</Label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="(00) 00000-0000"
                                            className="bg-secondary/50 border-0 rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data de Nascimento</Label>
                                        <Input
                                            type="date"
                                            value={formData.birth_date}
                                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                            className="bg-secondary/50 border-0 rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gênero</Label>
                                        <Select
                                            value={formData.gender}
                                            onValueChange={(v) => setFormData({ ...formData, gender: v })}
                                        >
                                            <SelectTrigger className="bg-secondary/50 border-0 rounded-xl h-11">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {genderOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado Civil</Label>
                                        <Select
                                            value={formData.marital_status}
                                            onValueChange={(v) => setFormData({ ...formData, marital_status: v })}
                                        >
                                            <SelectTrigger className="bg-secondary/50 border-0 rounded-xl h-11">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {maritalStatusOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="address" className="space-y-6 mt-0 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Logradouro</Label>
                                        <Input
                                            value={formData.address_street}
                                            onChange={(e) => setFormData({ ...formData, address_street: e.target.value })}
                                            className="bg-secondary/50 border-0 rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Número</Label>
                                        <Input
                                            value={formData.address_number}
                                            onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                                            className="bg-secondary/50 border-0 rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Complemento</Label>
                                        <Input
                                            value={formData.address_complement}
                                            onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                                            className="bg-secondary/50 border-0 rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bairro</Label>
                                        <Input
                                            value={formData.address_neighborhood}
                                            onChange={(e) => setFormData({ ...formData, address_neighborhood: e.target.value })}
                                            className="bg-secondary/50 border-0 rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cidade</Label>
                                        <Input
                                            value={formData.address_city}
                                            onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
                                            className="bg-secondary/50 border-0 rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado (UF)</Label>
                                        <Select
                                            value={formData.address_state}
                                            onValueChange={(v) => setFormData({ ...formData, address_state: v })}
                                        >
                                            <SelectTrigger className="bg-secondary/50 border-0 rounded-xl h-11">
                                                <SelectValue placeholder="UF" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {brazilianStates.map(state => (
                                                    <SelectItem key={state} value={state}>{state}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CEP</Label>
                                        <Input
                                            value={formData.address_zip}
                                            onChange={(e) => setFormData({ ...formData, address_zip: e.target.value })}
                                            className="bg-secondary/50 border-0 rounded-xl h-11"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="more" className="space-y-6 mt-0 animate-fade-in">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profissão</Label>
                                        <Input
                                            value={formData.profession}
                                            onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                                            className="bg-secondary/50 border-0 rounded-xl h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Observações Adicionais</Label>
                                        <Textarea
                                            rows={6}
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            className="bg-secondary/50 border-0 rounded-2xl resize-none p-4"
                                            placeholder="Como chegou à nossa igreja? Alguma observação especial?"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <div className="mt-10 flex flex-col md:flex-row justify-end gap-3">
                                <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl h-12 h-12 uppercase text-[10px] font-black tracking-widest border-border/50">Cancelar</Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="min-w-[200px] h-12 rounded-xl bg-primary text-white hover:opacity-90 shadow-soft uppercase text-[10px] font-black tracking-widest"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                    Finalizar Solicitação
                                </Button>
                            </div>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
