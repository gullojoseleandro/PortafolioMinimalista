# Portafolio Minimalista

Static portfolio served by an unprivileged Nginx container on port 8080.

```sh
docker build -t portfolio:local .
docker run --rm -p 8080:8080 portfolio:local
```

Check the site at `http://localhost:8080` and health at
`http://localhost:8080/healthz`.

Every push to `master` publishes `ghcr.io/gullojoseleandro/portafoliominimalista`
with an immutable `sha-<commit>` tag and a moving `master` tag. Production must
pin the resulting digest (`image@sha256:...`), not the moving tag.
