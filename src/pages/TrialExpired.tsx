import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Lock, CreditCard, LogOut } from "lucide-react";

const TrialExpired = () => {
  const { signOut, tenant } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-destructive/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Período de Teste Expirado</CardTitle>
          <CardDescription>
            O período de teste de 4 dias para <strong>{tenant?.name}</strong> chegou ao fim.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 text-muted-foreground">
          <p>
            Esperamos que você tenha desfrutado da nossa plataforma durante este período. Para continuar acessando todos os recursos, uma assinatura ativa é necessária.
          </p>
          <div className="p-4 bg-muted/50 rounded-lg text-sm italic">
            "Buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas." - Mateus 6:33
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full gap-2" size="lg">
            <CreditCard className="w-4 h-4" />
            Assinar Agora
          </Button>
          <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TrialExpired;
