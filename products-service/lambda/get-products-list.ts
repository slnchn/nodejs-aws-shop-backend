import * as productsRepository from "./products-data/products-repository";
import { buildResponse } from "./utils";

export const getProductsList = async () => {
  try {
    const products = await productsRepository.listProducts();

    console.log("getProductsList", process.env.PRODUCTS_TABLE_NAME);

    if (!products) {
      return buildResponse(404, { message: "Products not found" });
    }

    return buildResponse(200, products);
  } catch (error) {
    console.error(error);
    return buildResponse(500, { message: "Internal server error" });
  }
};
