import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Clock, LogOut, CheckCircle2 } from "lucide-react";

const PendingApproval = () => {
  const { signOut, tenant } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-primary/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
            <Clock className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold font-serif">Aguardando Aprovação</CardTitle>
          <CardDescription>
            Seu cadastro na <strong>{tenant?.name}</strong> está sendo analisado.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 text-muted-foreground">
          <p>
            O Pastor ou responsável pela igreja já foi notificado sobre sua solicitação. Assim que seu acesso for aprovado, você poderá desfrutar de todos os recursos da nossa plataforma.
          </p>
          <div className="p-4 bg-muted/50 rounded-lg text-sm flex items-start gap-3 text-left">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <p>Fique tranquilo! Você receberá um e-mail informando assim que sua entrada for autorizada.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PendingApproval;
