FROM node:24-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/opt/venv/bin:$PATH"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        ffmpeg \
        fontconfig \
        libgomp1 \
        fonts-liberation \
        fonts-noto-core \
        fonts-noto-extra \
        python3 \
        python3-venv \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv \
    && pip install --upgrade pip \
    && pip install faster-whisper==1.2.1 yt-dlp==2026.08.19

WORKDIR /app

COPY fonts/ /usr/local/share/fonts/kantumruy/
RUN fc-cache -fv

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
RUN npm run build

ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["node", "scripts/render-start.mjs"]
