FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN corepack enable && npm ci && npm run build

FROM node:22-slim AS runner
ENV NODE_ENV=production PORT=8000
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN corepack enable && npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:8000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
