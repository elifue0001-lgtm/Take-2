# Devcontainer Dockerfile for reproducible Next.js development
FROM node:18-bullseye-slim

# Install OS deps useful for builds and debugging
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  git \
  build-essential \
  python3 \
  && rm -rf /var/lib/apt/lists/*

# Ensure corepack is available for pnpm/yarn shims
RUN corepack enable || true

# Create app directory and switch to non-root node user
WORKDIR /workspace

# Use the node user provided by the base image
USER node

# Default command left to devcontainer configuration (postCreateCommand runs npm install)
