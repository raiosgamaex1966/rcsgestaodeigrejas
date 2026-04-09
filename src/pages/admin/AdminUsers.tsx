import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User, Shield, ShieldCheck, ShieldAlert } from "lucide-react";

type AppRole = 'admin' | 'moderator' | 'user';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

const AdminUsers = () => {
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role");
      
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const getUserRole = (userId: string): AppRole => {
    const userRole = roles.find(r => r.user_id === userId);
    return userRole?.role || 'user';
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      // First, delete existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Then insert new role
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });

      if (error) throw error;
      
      toast({ title: "Permissão atualizada!" });
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin': return ShieldAlert;
      case 'moderator': return ShieldCheck;
      default: return Shield;
    }
  };

  const getRoleColor = (role: AppRole) => {
    switch (role) {
      case 'admin': return "bg-destructive/10 text-destructive";
      case 'moderator': return "bg-accent/10 text-accent";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const isLoading = profilesLoading || rolesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Usuários</h1>
        <p className="text-muted-foreground">Gerencie os usuários e permissões</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum usuário cadastrado</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => {
            const role = getUserRole(profile.id);
            const RoleIcon = getRoleIcon(role);
            
            return (
              <Card key={profile.id} variant="elevated" className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {profile.full_name || "Sem nome"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Cadastrado em {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getRoleColor(role)}`}>
                      <RoleIcon className="w-4 h-4" />
                    </div>
                    
                    <Select 
                      value={role} 
                      onValueChange={(v: AppRole) => handleRoleChange(profile.id, v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Usuário</SelectItem>
                        <SelectItem value="moderator">Moderador</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
