import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import * as productsRepository from "./products-data/products-repository";
import { buildResponse } from "./utils";
import { logError, logInfo } from "./logger";

export const getProduct = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (event?.pathParameters?.id) {
      logInfo(
        "getProduct",
        `Getting product by id=${event.pathParameters.id} started`
      );

      const result = await productsRepository.getProduct(
        event.pathParameters.id
      );

      if (!result.success) {
        logError("getProduct", result.error);
        return buildResponse(500, { message: result.error });
      }

      if (!result.data) {
        logError("getProduct", "Product not found");
        return buildResponse(404, { message: "Product not found" });
      }

      logInfo(
        "getProduct",
        `Getting product by id=${event.pathParameters.id} succesfully finished`
      );

      return buildResponse(200, result.data);
    }

    // I believe it won't get here as we have /products route but just in case ;)
    logError("getProduct", "Please provide id");
    return buildResponse(400, { message: "Please provide id" });
  } catch (error) {
    if (error instanceof Error) {
      logError("getProduct", error.message);
    }

    return buildResponse(500, { message: "Internal server error" });
  }
};
