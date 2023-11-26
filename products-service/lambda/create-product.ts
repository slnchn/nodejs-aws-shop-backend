import { randomUUID } from "node:crypto";
import { APIGatewayProxyEvent } from "aws-lambda";

import { validateCreateProduct } from "./validators/validate-create-product";
import { createProductStock } from "./products-data/products-repository";
import { buildResponse } from "./utils";
import { logError } from "./logger";

export const createProduct = async (event: APIGatewayProxyEvent) => {
  try {
    const { body } = event;
    const product = JSON.parse(body || "{}");
    const validationResult = validateCreateProduct(product);
    if (!validationResult.success) {
      return buildResponse(400, {
        message: "Bad Request",
        errors: validationResult.errors,
      });
    }

    const productStockData = {
      id: randomUUID(),
      title: product.title,
      description: product.description,
      price: product.price,
      count: product.count,
    };

    const result = await createProductStock(productStockData);
    if (!result.success) {
      return buildResponse(500, { message: result.error });
    }

    if (!result.data) {
      return buildResponse(500, {
        message: "Something weird happened during product creation",
      });
    }

    return buildResponse(200, result.data);
  } catch (error) {
    if (error instanceof Error) {
      logError("createProduct", error.message);
    }

    return buildResponse(500, { message: "Internal server error" });
  }
};
