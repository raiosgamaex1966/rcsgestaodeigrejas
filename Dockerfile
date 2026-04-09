# Estágio de Build
FROM node:20-alpine AS build

WORKDIR /app

# Copiar os arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar o restante do código
COPY . .

# Variáveis de build (precisam ser passadas no momento do build)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Gerar o build de produção
RUN npm run build

# Estágio de Produção
FROM nginx:stable-alpine

# Copiar configuração customizada do Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar os arquivos do build para a pasta do Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
