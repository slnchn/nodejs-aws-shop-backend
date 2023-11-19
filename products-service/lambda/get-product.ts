import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import * as productsRepository from "./products-data/products-repository";
import { buildResponse } from "./utils";

export const getProduct = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (event?.pathParameters?.id) {
      const product = await productsRepository.getProduct(
        event.pathParameters.id
      );

      if (product) {
        return buildResponse(200, product);
      }

      return buildResponse(404, { message: "Product not found" });
    }

    // I believe it won't get here as we have /products route but just in case ;)
    return buildResponse(400, { message: "Please provide id" });
  } catch (error) {
    return buildResponse(500, { message: "Internal server error" });
  }
};
