FROM nginx:1.31.6-alpine@sha256:adad2ae9204d0fd7a34f40299bc838c3782be1293b10005eac4315ff5a1abf4e

COPY nginx.conf /etc/nginx/nginx.conf
COPY index.html modern-styles.css script.js /usr/share/nginx/html/
COPY assets/ /usr/share/nginx/html/assets/

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

