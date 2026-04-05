# 1. Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm ci

# Copy all files and build
COPY . .
RUN npm run build

# 2. Production stage (Nginx)
FROM nginx:stable-alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Generic Nginx config to handle SPA routing (optional but recommended)
RUN printf 'server {\n\tlisten 80;\n\tlocation / {\n\t\troot /usr/share/nginx/html;\n\t\tindex index.html index.htm;\n\t\ttry_files $uri $uri/ /index.html;\n\t}\n}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
