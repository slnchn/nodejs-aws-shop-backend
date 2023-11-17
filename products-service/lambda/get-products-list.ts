import * as productsRepository from "./products-data/products-repository";
import { buildResponse } from "./utils";

export const getProductsList = async () => {
  const products = await productsRepository.listProducts();
  return buildResponse(200, products);
};
