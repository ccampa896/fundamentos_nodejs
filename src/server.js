import http from 'node:http';
import { json } from './middlewares/json.js';
import { routes } from './routes.js';
import { extractQueryParams } from './utils/extract-query-params.js';
import { buildRoutePath } from './utils/build-route-path.js';

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  const route = routes.find(
    route => route.method === method && route.path.test(url)
  );

  if (route) {
    // Aplica o middleware JSON somente se a rota NÃO for de upload
    if (!url.startsWith('/upload')) {
      await json(req, res);
    }

    const routeParams = req.url.match(route.path);

    const { query, ...params } = routeParams.groups;

    req.params = params;
    req.query = query ? extractQueryParams(query) : {};

    return route.handler(req, res);
  }

  return res.writeHead(404).end();
});

server.listen(3333);
