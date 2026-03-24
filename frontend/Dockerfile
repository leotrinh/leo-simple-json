# Stage 1: build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# NEXT_PUBLIC_* vars must be available at build time (inlined by Next.js)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 2: run (minimal — uses Next.js standalone output)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Standalone output already includes server + deps
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
