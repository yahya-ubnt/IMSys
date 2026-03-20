# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_BASE_URL_CLIENT
ARG NEXT_PUBLIC_API_BASE_URL_SERVER

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_BASE_URL_CLIENT=$NEXT_PUBLIC_API_BASE_URL_CLIENT
ENV NEXT_PUBLIC_API_BASE_URL_SERVER=$NEXT_PUBLIC_API_BASE_URL_SERVER

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Copy production artifacts from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package.json ./package.json

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /usr/src/app
USER appuser

EXPOSE 3000
CMD [ "npm", "start" ]
