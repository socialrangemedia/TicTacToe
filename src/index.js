import http from 'node:http';

const port = Number(process.env.PORT || 3000);
const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Node app — replace src/index.js with your application.\n');
});

server.listen(port, () => {
  console.log(`Listening on http://0.0.0.0:${port}`);
});
