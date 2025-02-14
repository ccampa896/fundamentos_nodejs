import http from 'node:http';
import { json } from './middlewares/json.js';
import { routes } from './routes.js';
import { extractQueryParams } from './utils/extract-query-params.js';

/*
ROTAS:

- Criar usuários
- Listagem de usuários
- Edição de usuários
- Remoção de usuários

 - HTTP
   - Métodos HTTP
   - URL

   - GET, POST, PUT, PATCH, DELETE
   GET: Buscar informações do back-end
   POST: Criar uma informação no back-end
   PUT: Alterar uma informação no back-end
   PATCH: Alterar uma informação específica
   DELETE: Deletar uma informação no back-end

   GET /users => Buscando usuários no back-end
   POST /users => Criar um usuário no back-end

   - Stateful - Stateless

   JSON - JavaScript Object Notation

   Cabeçalhos (Requisição/Resposta): são metadados

   HTTP Status Code

   Query Parameters: URL Stateful => filtros, paginação, não obrigatório
   Route Parameters: URL Stateless => identificar um recurso específico, obrigatório
   Request Body: Stateless => dados para criação ou alteração de um recurso, obrigatório

*/

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  await json(req, res);

  const route = routes.find(
    route => route.method === method && route.path.test(url)
  );

  if (route) {
    const routeParams = req.url.match(route.path);

    const { query, ...params } = routeParams.groups;

    req.params = params;
    req.query = query ? extractQueryParams(query) : {};

    return route.handler(req, res);
  }

  return res.writeHead(404).end();
});

server.listen(3333);
