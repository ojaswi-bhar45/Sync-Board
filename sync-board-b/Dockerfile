FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-alpine
WORKDIR /app
RUN addgroup --system app && adduser --system --ingroup app app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER app
EXPOSE 5000
CMD ["node", "app.js"]
