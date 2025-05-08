# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy TypeScript source and config
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# Expose port
EXPOSE 5500

# Start the app
CMD ["node", "dist/index.js"]