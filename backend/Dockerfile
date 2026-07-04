# Use Node.js official image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy entire backend code
COPY . .

# Expose port (same as your server.js)
EXPOSE 5000

# Run the server
CMD ["node", "server.js"]