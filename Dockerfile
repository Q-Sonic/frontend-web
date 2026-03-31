# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias primero (cache layer)
COPY package*.json ./
RUN npm ci

# Copiar el resto del código y construir
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Copiar el build de Vite a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración básica de Nginx para React (manejo de rutas de react-router)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
