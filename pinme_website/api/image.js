const { handleImageProxy, setCorsHeaders } = require('../back_end/server');

module.exports = async function image(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  return handleImageProxy(req, res);
};
