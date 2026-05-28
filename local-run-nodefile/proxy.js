const http = require('http');
const httpProxy = require('http-proxy');

const TARGET = process.env.TARGET || 'alb.domain.com';
const HOST_HEADER = process.env.HOST_HEADER || 'loglens.cu-final.app';
const PORT = process.env.PORT || 8080;

const proxy = httpProxy.createProxyServer({});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
  }
  res.end('Bad gateway');
});

const server = http.createServer((req, res) => {
  req.headers.host = HOST_HEADER;
  proxy.web(req, res, { target: TARGET });
});

server.on('upgrade', (req, socket, head) => {
  req.headers.host = HOST_HEADER;
  proxy.ws(req, socket, head, { target: TARGET });
});

server.listen(PORT, () => {
  console.log(`Proxy listening on http://localhost:${PORT} -> ${TARGET} (Host: ${HOST_HEADER})`);
});
