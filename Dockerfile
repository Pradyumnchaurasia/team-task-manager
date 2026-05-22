FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma compatibility on alpine
RUN apk add --no-cache openssl

# Copy all project files
COPY . .

# Install dependencies for all workspaces
RUN npm install --include=dev

# Compile React frontend and generate Prisma client
RUN npm run build

# Expose Express server port
EXPOSE 5000

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start Express server
CMD ["node", "backend/src/app.js"]
