FROM node:20-alpine

WORKDIR /app

# Install openssl for Prisma compatibility on alpine
RUN apk add --no-cache openssl

# Copy backend files
COPY . .

# Install dependencies for both backend and nested frontend
RUN npm install
RUN npm install --prefix frontend

# Compile frontend and generate Prisma client
RUN npm run build

# Expose Express server port
EXPOSE 5000

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start Express server
CMD ["node", "src/app.js"]
