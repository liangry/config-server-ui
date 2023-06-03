const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(createProxyMiddleware('/api/v1', {
    target : process.env.CONFIG_SERVER_ADDRESS,
    changeOrigin : true,
    ws: true,
    pathRewrite: {
      '^/api/v1': '',
    },
  }));
};