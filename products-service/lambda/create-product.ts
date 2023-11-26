import { randomUUID } from "node:crypto";
import { APIGatewayProxyEvent } from "aws-lambda";

import { validateCreateProduct } from "./validators/validate-create-product";
import { createProductStock } from "./products-data/products-repository";
import { buildResponse } from "./utils";

export const createProduct = async (event: APIGatewayProxyEvent) => {
  try {
    const { body } = event;

    console.log("createProduct", body);

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

    await createProductStock(productStockData);

    return buildResponse(200, productStockData);
  } catch (error) {
    console.error(error);
    return buildResponse(500, { message: "Internal server error" });
  }
};
