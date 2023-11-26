import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import * as productsRepository from "./products-data/products-repository";
import { buildResponse } from "./utils";
import { logError } from "./logger";

export const getProduct = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (event?.pathParameters?.id) {
      const result = await productsRepository.getProduct(
        event.pathParameters.id
      );

      if (!result.success) {
        return buildResponse(500, { message: result.error });
      }

      if (result.data) {
        return buildResponse(200, result.data);
      }

      return buildResponse(404, { message: "Product not found" });
    }

    // I believe it won't get here as we have /products route but just in case ;)
    return buildResponse(400, { message: "Please provide id" });
  } catch (error) {
    if (error instanceof Error) {
      logError("getProduct", error.message);
    }

    return buildResponse(500, { message: "Internal server error" });
  }
};
