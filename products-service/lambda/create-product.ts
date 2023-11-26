import { randomUUID } from "node:crypto";
import { APIGatewayProxyEvent } from "aws-lambda";

import { validateCreateProduct } from "./validators/validate-create-product";
import { createProductStock } from "./products-data/products-repository";
import { buildResponse } from "./utils";
import { logError, logInfo } from "./logger";

export const createProduct = async (event: APIGatewayProxyEvent) => {
  try {
    logInfo("createProduct", "Creating product started");

    const { body } = event;
    const product = JSON.parse(body || "{}");
    logInfo("createProduct", `Creating product with data: ${body}`);
    const validationResult = validateCreateProduct(product);
    if (!validationResult.success) {
      logError("createProduct", validationResult.errors.join(", "));
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
      logError("createProduct", result.error);
      return buildResponse(500, { message: result.error });
    }

    if (!result.data) {
      logError(
        "createProduct",
        "Something weird happened during product creation"
      );
      return buildResponse(500, {
        message: "Something weird happened during product creation",
      });
    }

    logInfo("createProduct", "Creating product succesfully finished");
    return buildResponse(200, result.data);
  } catch (error) {
    if (error instanceof Error) {
      logError("createProduct", error.message);
    }

    return buildResponse(500, { message: "Internal server error" });
  }
};
