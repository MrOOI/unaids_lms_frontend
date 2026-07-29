FROM node:22-alpine AS build
WORKDIR /source
COPY package.json package-lock.json ./
COPY apps/learner/package.json apps/learner/
COPY packages/ui/package.json packages/ui/
COPY packages/i18n/package.json packages/i18n/
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY deploy/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /source/apps/learner/dist /usr/share/nginx/html
EXPOSE 80
