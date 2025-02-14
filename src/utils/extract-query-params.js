export function extractQueryParams(query) {
  if (!query) return {};

  return query
    .slice(1) // Remove o '?' inicial
    .split('&')
    .reduce((queryParams, param) => {
      const [key, value] = param.split('=');
      queryParams[key] = value;
      // Decodifica espaços (%20) e outros caracteres
      // decodeURIComponent(value || '')
      return queryParams;
    }, {});
}
