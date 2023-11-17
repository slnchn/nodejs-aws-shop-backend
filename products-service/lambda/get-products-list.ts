import * as productsRepository from "./products-data/products-repository";

export const getProductsList = async () => {
  const products = await productsRepository.listProducts();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // You can add more headers as needed
    },
    body: JSON.stringify(products),
  };
};
