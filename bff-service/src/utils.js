const { PRODUCT_SERVICE_NAME, CART_SERVICE_NAME } = require('./constants');

const getRecepientServiceName = (url) => {
  if (url.startsWith(`/${PRODUCT_SERVICE_NAME}`)) {
    return PRODUCT_SERVICE_NAME;
  }

  if (url.startsWith(`/${CART_SERVICE_NAME}}`)) {
    return CART_SERVICE_NAME;
  }

  return null;
};

const parseBffUrl = (url) => {
  const result = { success: false, url: '' };

  const serviceName = getRecepientServiceName(url);
  if (!serviceName) {
    return {
      ...result,
      error: "Unknown service name. Please use either 'cart' or 'product'",
    };
  }

  result.success = true;
  result.serviceName = serviceName;

  return result;
};

module.exports = {
  parseBffUrl,
};
