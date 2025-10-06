# Build stage
FROM node:20-slim AS builder

WORKDIR /usr/src/app

# Instalar dependencias necesarias para compilar canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /usr/src/app

# Instalar solo las dependencias runtime de canvas (sin herramientas de compilación)
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose port
EXPOSE 3030

# Create non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs nestjs

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /usr/src/app

USER nestjs

# Start the server
CMD ["node", "dist/main.js"]