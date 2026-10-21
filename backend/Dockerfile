FROM node:20-bookworm

# Install required packages
RUN apt-get update && \
    apt-get install -y curl git zstd && \
    rm -rf /var/lib/apt/lists/*

# Enable pnpm
RUN corepack enable

WORKDIR /app

# Copy dependency files first
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source
COPY . .

# Generate Prisma Client
RUN pnpm prisma:generate

# Build the application
RUN pnpm build

# Hugging Face Spaces listens on port 7860
ENV PORT=7860
ENV NODE_ENV=production

EXPOSE 7860

CMD ["pnpm", "start"]
