const { config } = require('dotenv');
const fastify = require('fastify')();
const axios = require('axios');

const { parseBffUrl } = require('./utils');
const { CART_SERVICE_NAME, PRODUCT_SERVICE_NAME } = require('./constants');
const { productsCache } = require('./products-cache');

config();

const recipientUrls = {
  [CART_SERVICE_NAME]: process.env.CART_SERVICE_URL,
  [PRODUCT_SERVICE_NAME]: process.env.PRODUCT_SERVICE_URL,
};

const TWO_MINUTES = 2 * 60 * 1000;

fastify.get('/products', async (request, reply) => {
  const now = Date.now();
  console.log(now - productsCache.time);
  if (now - productsCache.time < TWO_MINUTES && productsCache.data.length > 0) {
    console.log('Returning products from cache');
    return reply.send(productsCache.data);
  }

  console.log('Not cached or cache expired, fetching from service');

  try {
    const response = await axios({
      method: 'GET',
      url: `${recipientUrls[PRODUCT_SERVICE_NAME]}/products`,
    });

    productsCache.time = now;
    productsCache.data = response.data;

    reply.send(response.data);
  } catch (error) {
    if (error.response) {
      reply.status(error.response.status).send(error.response.data);
    } else {
      console.error(error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
});

fastify.route({
  method: ['GET', 'POST', 'PUT', 'DELETE'],
  url: '/*',
  handler: async (request, reply) => {
    const parsed = parseBffUrl(request.url);
    if (!parsed.success) {
      return reply.status(502).send({ error: parsed.error });
    }

    const recipientUrl = recipientUrls[parsed.serviceName];

    if (!recipientUrl) {
      return reply.status(502).send({
        error: "Couldn't find recipient service URL",
      });
    }

    try {
      const response = await axios({
        method: request.method,
        url: `${recipientUrl}${request.url}`,
        params: request.query,
        data: request.body,
        headers: {
          // Authorization: 'Basic c2xuY2huOjEyMzQ1Ng==',
        },
      });

      // Forward the recipient service response to the client
      reply.status(response.status).send(response.data);
    } catch (error) {
      // Handle recipient service errors
      if (error.response) {
        // Forward the recipient service error to the client
        reply.status(error.response.status).send(error.response.data);
      } else {
        // Handle other errors
        console.error(error);
        reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  },
});

fastify.listen({ port: process.env.PORT || 3000 }, (err, address) => {
  if (err) {
    console.log(err);
    throw err;
  }

  console.log(`Server listening at ${address}`);
});
