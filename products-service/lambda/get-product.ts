import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import * as productsRepository from "./products-data/products-repository";

export const getProduct = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (event?.pathParameters?.id) {
    const product = await productsRepository.getProduct(
      event.pathParameters.id
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    };
  }

  return {
    statusCode: 400,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      error: "Bad request",
    }),
  };
};
