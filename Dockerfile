# --- Stage 1: Builder ---
# We use a specific node version based on your alpine preferences for a small footprint
FROM node:20-alpine AS builder

# Install build tools required for native modules (like better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first to leverage Docker cache for dependencies
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for building Vite)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend (Vite -> dist folder)
RUN npm run build

# --- Stage 2: Runner ---
FROM node:20-alpine AS runner

# Install build tools again for the production environment to rebuild native modules if needed
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ONLY production dependencies to keep image small
RUN npm install --production

# Copy the built frontend assets from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the backend server file
COPY server.js .

# Create the data directory to ensure permissions are right
RUN mkdir -p /app/data

# Expose the port defined in your server.js
EXPOSE 3000

# Define the volume for persistent data
VOLUME ["/app/data"]

# Set environment variables (Defaults, can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Start the application
CMD ["npm", "start"]
