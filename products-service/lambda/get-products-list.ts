import * as productsRepository from "./products-data/products-repository";
import { buildResponse } from "./utils";

export const getProductsList = async () => {
  try {
    const products = await productsRepository.listProducts();
    return buildResponse(200, products);
  } catch (error) {
    return buildResponse(500, { message: "Internal server error" });
  }
};
