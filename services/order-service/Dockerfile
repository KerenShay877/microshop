FROM oven/bun:1-alpine
RUN apk add --no-cache openssl netcat-openbsd
WORKDIR /app
COPY package.json ./
RUN bun install
COPY prisma/ ./prisma/
RUN bunx prisma generate
COPY src/ ./src/
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 3002
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["bun", "run", "src/index.ts"]
