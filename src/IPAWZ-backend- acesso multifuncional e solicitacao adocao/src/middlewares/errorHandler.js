function notFound(req, res) {
  return res.status(404).json({ mensagem: 'Rota não encontrada.' });
}
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(error);
  const status = Number(error.statusCode || 500);
  return res.status(status).json({
    mensagem: status >= 500 ? 'Erro interno do servidor.' : error.message
  });
}
module.exports = { notFound, errorHandler };
