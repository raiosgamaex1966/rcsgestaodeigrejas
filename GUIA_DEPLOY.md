# 🚀 Guia Fácil: Como colocar seu App na Internet (Portainer + Traefik)

Olá! Siga este passo a passo simples para colocar o aplicativo da sua igreja para funcionar no seu servidor. Não precisa ser programador, basta seguir a ordem:

## 1. O que nós já fizemos?
Eu já criei para você os "manuais do robô" que o seu servidor precisa. Eles estão na pasta do seu projeto:
*   **Dockerfile**: É a receita para construir o aplicativo.
*   **nginx.conf**: É o guarda de trânsito que guia as pessoas dentro do site.
*   **docker-compose.yml**: É o comando mestre que o Portainer vai ler.

---

## 2. Passo 1: Preparar os arquivos
Você precisa enviar a pasta inteira do seu projeto para o seu servidor ou para o seu GitHub. 
> **Atenção**: Os três arquivos (`Dockerfile`, `nginx.conf` e `docker-compose.yml`) precisam estar na **raiz** (a pasta principal) do projeto.

---

## 3. Passo 2: Configurar o seu domínio
Antes de ir para o Portainer, você precisa ir onde comprou seu domínio (ou no Cloudflare) e criar um apontamento:
*   **Tipo**: `A`
*   **Nome**: `app` (ou o nome que você quiser, ex: `igreja`)
*   **Destino**: O número do IP do seu servidor.

---

## 4. Passo 3: Colocar no Portainer
Agora abra o seu Portainer e faça o seguinte:

1. Clique em **Stacks** no menu do lado esquerdo.
2. Clique no botão azul **+ Add stack**.
3. Dê um nome para ela (tudo minúsculo, ex: `app-igreja`).
4. No campo que aparecer (Web editor), copie e cole todo o conteúdo do arquivo `docker-compose.yml` que eu criei para você.

### ⚠️ Duas alterações importantes no texto:
Dentro do Portainer, procure e mude estas duas coisas no texto que você colou:

*   **O seu link**: Procure por `seu-dominio.com` e troque pelo seu link real (ex: `app.minhaigreja.com.br`).
*   **A rede do Traefik**: No final do arquivo, onde diz `traefik-public`, verifique se esse é o nome da rede que o seu Traefik usa. Se a sua rede tiver outro nome (como `proxy` ou `gateway`), troque ali.

---

## 5. Passo 4: O Toque Final
1. Desça a página e clique no botão azul **Deploy the stack**.
2. O Portainer vai começar a "cozinhar" o seu aplicativo. Isso pode demorar uns 2 ou 3 minutinhos na primeira vez.
3. Quando terminar, vai aparecer um sinal verde escrito "Started".

**PRONTO!** Agora é só abrir o link que você escolheu no seu navegador e o aplicativo da igreja estará no ar com o cadeado de segurança (SSL) ativado pelo Traefik automaticamente. 🕊️✨

---

### Dica de Ouro:
Se você precisar mudar alguma senha ou chave do Supabase no futuro, você volta nessa **Stack**, muda os valores lá em `args` e clica em **Update the stack**. O robô faz o resto sozinho!
