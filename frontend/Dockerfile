FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./frontend/
COPY api-gateway/package.json ./api-gateway/
COPY api-gateway/src/ ./api-gateway/src/
RUN cd api-gateway && npm install
WORKDIR /app/frontend
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/frontend/.next ./.next
COPY --from=builder /app/frontend/public ./public
COPY --from=builder /app/frontend/package.json ./package.json
COPY --from=builder /app/frontend/node_modules ./node_modules
COPY --from=builder /app/frontend/next.config.js ./
EXPOSE 4000
CMD ["npm", "start"]
