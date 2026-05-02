FROM node:20-slim

# Install dependencies for Puppeteer and Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libnss3 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libcairo2 \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Skip Puppeteer's internal browser download and use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy application source
COPY . .

# Run the application
CMD ["node", "index.js"]
