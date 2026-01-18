# syntax=docker/dockerfile:1
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json pnpm-lock.yaml ./
RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    else npm install; fi
COPY . .
RUN npm run build

FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend /app/backend
WORKDIR /app/backend
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir .
COPY --from=frontend-build /app/dist /app/dist
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
