import { randomUUID } from "node:crypto";
import { APIGatewayProxyEvent } from "aws-lambda";

import { buildResponse } from "./utils";
import { createProductStock } from "./products-data/products-repository";

export const createProduct = async (event: APIGatewayProxyEvent) => {
  try {
    const { body } = event;

    console.log("createProduct", body);

    const product = JSON.parse(body || "{}");

    if (
      !product.title ||
      !product.description ||
      !product.price ||
      !product.count
    ) {
      return buildResponse(400, { message: "Bad request" });
    }

    // TODO: validate data (types and values)

    const productStockData = {
      id: randomUUID(),
      title: product.title,
      description: product.description,
      price: product.price,
      count: product.count,
    };

    await createProductStock(productStockData);

    return buildResponse(200, productStockData);
  } catch (error) {
    console.error(error);
    return buildResponse(500, { message: "Internal server error" });
  }
};
