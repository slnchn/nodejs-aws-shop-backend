import { logError, logInfo } from "./logger";
import * as productsRepository from "./products-data/products-repository";
import { buildResponse } from "./utils";

export const getProductsList = async () => {
  try {
    logInfo("getProductsList", "Getting products list started");

    const result = await productsRepository.listProducts();
    if (!result.success) {
      logError("getProductsList", result.error);
      return buildResponse(500, { message: result.error });
    }

    if (!result.data) {
      logError("getProductsList", "Products not found");
      return buildResponse(404, { message: "Products not found" });
    }

    logInfo("getProductsList", "Getting products list succesfully finished");
    return buildResponse(200, result.data);
  } catch (error) {
    if (error instanceof Error) {
      logError("getProductsList", error.message);
    }

    return buildResponse(500, { message: "Internal server error" });
  }
};
