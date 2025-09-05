# Base image
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install app dependencies
RUN npm ci --only=production && npm cache clean --force

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN npm run build

# Expose port
EXPOSE 3030

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

# Start the server using the production build
CMD ["node", "dist/main.js"]