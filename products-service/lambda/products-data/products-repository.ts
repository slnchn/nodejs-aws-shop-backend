import {
  BatchGetItemCommand,
  DynamoDBClient,
  GetItemCommand,
  ScanCommand,
  BatchWriteItemCommand,
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

// TODO: refactor
// 1. handling edge cases
// 2. merging products and stocks

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
  const getProductParams = {
    TableName: process.env.PRODUCTS_TABLE_NAME, // replace with your table name
    Key: {
      id: { S: id }, // replace 'productId' with your id attribute name
    },
  };

  const getProductStockParams = {
    TableName: process.env.STOCKS_TABLE_NAME,
    Key: {
      product_id: { S: id },
    },
  };

  const [productResponse, stockResponse] = await Promise.all([
    client.send(new GetItemCommand(getProductParams)),
    client.send(new GetItemCommand(getProductStockParams)),
  ]);

  if (productResponse.Item && stockResponse.Item) {
    const product = unmarshall(productResponse.Item);
    const stock = unmarshall(stockResponse.Item);
    return {
      ...product,
      count: stock.count,
    } as ProductStock;
  }

  return null;
};

export const createProductStock = async (product: ProductStock) => {
  const params = {
    RequestItems: {
      [process.env.PRODUCTS_TABLE_NAME as string]: [
        {
          PutRequest: {
            Item: {
              id: { S: product.id },
              title: { S: product.title },
              description: product.description
                ? { S: product.description }
                : { NULL: true },
              price: { N: product.price.toString() },
            },
          },
        },
      ],

      [process.env.STOCKS_TABLE_NAME as string]: [
        {
          PutRequest: {
            Item: {
              product_id: { S: product.id },
              count: { N: product.count.toString() },
            },
          },
        },
      ],
    },
  };

  await client.send(new BatchWriteItemCommand(params));
};
