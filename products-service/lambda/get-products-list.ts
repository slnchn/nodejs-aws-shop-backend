import { logError } from "./logger";
import * as productsRepository from "./products-data/products-repository";
import { buildResponse } from "./utils";

export const getProductsList = async () => {
  try {
    const result = await productsRepository.listProducts();
    if (!result.success) {
      return buildResponse(500, { message: result.error });
    }

    if (!result.data) {
      return buildResponse(404, { message: "Products not found" });
    }

    return buildResponse(200, result.data);
  } catch (error) {
    if (error instanceof Error) {
      logError("getProductsList", error.message);
    }

    return buildResponse(500, { message: "Internal server error" });
  }
};
