# ---- Build Stage ----
FROM node:20-alpine AS builder

# Set working directory inside container
WORKDIR /app

# Accept build arguments for public environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_SITE_URL

# Set them as environment variables for the build process
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the frontend code
COPY . .

# Build the Next.js app (outputs to .next/)
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner

WORKDIR /app

# Install a minimal set of deps for production
COPY package.json ./
RUN npm install --only=production

# Copy built files from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose Next.js port
EXPOSE 3000

# Run Next.js in production mode
CMD ["npm", "run", "start"]
