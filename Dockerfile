# Railway / container deployment for Quotia.
#
# Single stage on purpose: the production server bundle (dist/index.js) statically
# imports server/vite.ts, which imports vite.config.ts. Because the build script
# uses esbuild with --packages=external, vite and its plugins stay as real runtime
# imports. devDependencies therefore have to exist at runtime, not only at build time.

FROM node:22-slim

WORKDIR /app

# Dependencies first so this layer is cached across source-only changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* variables into the client bundle, so the auth URL must be
# present at build time. It is public by design: it ships to the browser.
ARG VITE_NEON_AUTH_URL
ENV VITE_NEON_AUTH_URL=${VITE_NEON_AUTH_URL}

RUN npm run build

# NODE_ENV is set only after install/build on purpose. Setting it earlier would
# make npm ci skip devDependencies and break the build.
ENV NODE_ENV=production

# Railway injects $PORT; the server reads it and falls back to 5000 locally.
CMD ["node", "dist/index.js"]
