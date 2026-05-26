# Node.js Reverse Proxy

Simple Node.js reverse proxy using `http-proxy`.

This proxy forwards requests to a target server while overriding the `Host` header.

---

## Installation

Initialize project:

```bash
npm init -y
```

Install dependency:

```bash
npm install http-proxy
```

---

## Run Proxy

```bash
node proxy.js
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| TARGET | http://shared-alb-188398176.us-east-1.elb.amazonaws.com | Target backend URL |
| HOST_HEADER | loglens.cu-final.app | Host header sent to backend |
| PORT | 8080 | Local proxy port |

---

## Example

Run with custom values:

```bash
TARGET=http://example.com \
HOST_HEADER=example.com \
PORT=3000 \
node proxy.js
```

---

## Test

Open in browser:

```bash
http://localhost:8080
```

---

## Features

- Reverse proxy support
- Custom Host header forwarding
- WebSocket support
- Error handling
- Environment variable configuration