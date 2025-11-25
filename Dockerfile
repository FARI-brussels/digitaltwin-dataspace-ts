# Use official Node.js runtime as base image
FROM node:24

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application with increased header size for large file uploads
CMD ["node", "--max-http-header-size=65536", "dist/index.js"]