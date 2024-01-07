import {
  BatchGetItemCommand,
  DynamoDBClient,
  GetItemCommand,
  ScanCommand,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

import { Product, ProductStock, Stock, products } from "./products-data";
import { logError } from "../logger";

const client = new DynamoDBClient({ region: process.env.AWS_REGION });

const getProductsStocks = async (productIds: string[]) => {
  try {
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

    return batchGetResult.Responses[
      process.env.STOCKS_TABLE_NAME as string
    ].map((item) => unmarshall(item)) as Stock[];
  } catch (error) {
    if (error instanceof Error) {
      logError("productsRepository::getProductsStocks", error.message);
    }

    return null;
  }
};

type ListProductsResult =
  | {
      success: true;
      data: ProductStock[];
    }
  | {
      success: false;
      error: string;
    };

export const listProducts = async (): Promise<ListProductsResult> => {
  try {
    const productsScanParams = {
      TableName: process.env.PRODUCTS_TABLE_NAME,
    };

    const productsScanCommand = new ScanCommand(productsScanParams);
    const productsScanResult = await client.send(productsScanCommand);
    if (!(productsScanResult && productsScanResult.Items)) {
      logError("productsRepository::listProducts", "Products not found");
      return { success: false, error: "Products not found" };
    }

    const products = productsScanResult.Items.map((item) => unmarshall(item));
    const productIds = products.map((item) => item.id);
    const stocks = await getProductsStocks(productIds);
    if (!stocks) {
      logError("productsRepository::listProducts", "Stocks not found");
      return { success: false, error: "Stocks not found" };
    }

    const productsStocks = products.map((product) => {
      const stock = stocks.find((stock) => stock.product_id === product.id);
      return {
        ...product,
        count: stock?.count,
      };
    }) as ProductStock[];

    return { success: true, data: productsStocks };
  } catch (error) {
    if (error instanceof Error) {
      logError("productsRepository::listProducts", error.message);
    }

    return { success: false, error: "Products list retreiving error" };
  }
};

type GetProductResult =
  | {
      success: true;
      data: ProductStock;
    }
  | {
      success: false;
      error: string;
    };

export const getProduct = async (id: string): Promise<GetProductResult> => {
  try {
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
      const product = unmarshall(productResponse.Item) as Product;
      const stock = unmarshall(stockResponse.Item) as Stock;
      return {
        success: true,
        data: {
          ...product,
          count: stock.count,
        },
      };
    }

    return { success: false, error: "Product not found" };
  } catch (error) {
    if (error instanceof Error) {
      logError("productsRepository::getProduct", error.message);
    }

    return { success: false, error: "Product retreiving error" };
  }
};

type CreateProductStockResult =
  | {
      success: true;
      data: ProductStock;
    }
  | {
      success: false;
      error: string;
    };

export const createProductStock = async (
  product: ProductStock
): Promise<CreateProductStockResult> => {
  try {
    const params = {
      TransactItems: [
        {
          Put: {
            TableName: process.env.PRODUCTS_TABLE_NAME as string,
            Item: marshall(
              {
                id: product.id,
                title: product.title,
                description: product.description,
                price: product.price,
                image: product.image,
              },
              { removeUndefinedValues: true }
            ),
          },
        },
        {
          Put: {
            TableName: process.env.STOCKS_TABLE_NAME as string,
            Item: marshall({
              product_id: product.id,
              count: product.count,
            }),
          },
        },
      ],
    };

    await client.send(new TransactWriteItemsCommand(params));

    return { success: true, data: product };
  } catch (error) {
    if (error instanceof Error) {
      logError("productsRepository::createProductStock", error.message);
    }

    return { success: false, error: "Product creation error" };
  }
};
