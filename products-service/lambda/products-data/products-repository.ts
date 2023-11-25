import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

import { Product, products } from "./products-data";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

export const listProducts = async () => {
  console.log("listProducts", process.env.PRODUCTS_TABLE_NAME);

  const scanParams = {
    TableName: process.env.PRODUCTS_TABLE_NAME,
  };

  const scanCommand = new ScanCommand(scanParams);
  const scanResult = await client.send(scanCommand);

  if (scanResult && scanResult.Items) {
    return scanResult.Items.map((item) => unmarshall(item) as Product);
  }

  return null;
};

export const getProduct = async (id: string) => {
  return products.find((product) => product.id === id);
};
