import {
  BatchGetItemCommand,
  DynamoDBClient,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

import { ProductStock, Stock, products } from "./products-data";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

const getProductsStocks = async (productIds: string[]) => {
  const keys = productIds.map((productId) => ({
    product_id: { S: productId },
  }));

  const batchGetCommand = new BatchGetItemCommand({
    RequestItems: {
      [process.env.STOCKS_TABLE_NAME as string]: {
        Keys: keys,
      },
    },
  });

  const batchGetResult = await client.send(batchGetCommand);
  if (
    !(
      batchGetResult &&
      batchGetResult.Responses &&
      batchGetResult.Responses[process.env.STOCKS_TABLE_NAME as string]
    )
  ) {
    return null;
  }

  return batchGetResult.Responses[process.env.STOCKS_TABLE_NAME as string].map(
    (item) => unmarshall(item)
  ) as Stock[];
};

export const listProducts = async () => {
  const productsScanParams = {
    TableName: process.env.PRODUCTS_TABLE_NAME,
  };

  const productsScanCommand = new ScanCommand(productsScanParams);
  const productsScanResult = await client.send(productsScanCommand);
  if (!(productsScanResult && productsScanResult.Items)) {
    return null;
  }

  const products = productsScanResult.Items.map((item) => unmarshall(item));
  const productIds = products.map((item) => item.id);
  const stocks = await getProductsStocks(productIds);
  if (!stocks) {
    return null;
  }

  return products.map((product) => {
    const stock = stocks.find((stock) => stock.product_id === product.id);
    return {
      ...product,
      count: stock?.count,
    };
  }) as ProductStock[];
};

export const getProduct = async (id: string) => {
  return products.find((product) => product.id === id);
};
