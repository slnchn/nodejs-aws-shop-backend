import { randomUUID } from "node:crypto";

import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

import { ProductStock } from "../products-data/products-data";
import { logError } from "../logger";

export const buildProductStock = (
  productStockData: Omit<ProductStock, "id">
): ProductStock => ({
  id: randomUUID(),
  title: productStockData.title,
  description: productStockData.description,
  price: productStockData.price,
  count: productStockData.count,
});

const sns = new SNSClient();

export const sendProductStockEmail = async (productStock: ProductStock) => {
  try {
    await sns.send(
      new PublishCommand({
        TopicArn: process.env.SNS_ARN as string,
        Message: `New product was added: ${productStock.title}`,
        MessageAttributes: {
          count: {
            DataType: "Number",
            StringValue: `${productStock.count}`,
          },
        },
      })
    );

    return { success: true };
  } catch (err) {
    if (err instanceof Error) {
      logError("createProductService::buildProductStock", err.message);
    }

    return { success: false };
  }
};
