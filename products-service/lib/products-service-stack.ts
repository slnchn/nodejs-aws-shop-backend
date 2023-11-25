import { config } from "dotenv";

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

config();

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = dynamodb.Table.fromTableName(
      this,
      "ProductsTable",
      process.env.PRODUCTS_TABLE_NAME as string
    );

    const stocksTable = dynamodb.Table.fromTableName(
      this,
      "StocksTable",
      process.env.STOCKS_TABLE_NAME as string
    );

    const productsApi = new apiGateway.RestApi(this, "products-api", {
      restApiName: "Products Service",
      defaultCorsPreflightOptions: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: apiGateway.Cors.ALL_METHODS,
      },
    });

    const productsResource = productsApi.root.addResource("products");

    // get all
    const getProductsListHandler = new lambda.Function(
      this,
      "GetProductsListHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("lambda"),
        // I'd prefer get-products-list.handler but by the task description function name should be getProductsList
        handler: "get-products-list.getProductsList",

        environment: {
          PRODUCTS_TABLE_NAME: process.env.PRODUCTS_TABLE_NAME as string,
          STOCKS_TABLE_NAME: process.env.STOCKS_TABLE_NAME as string,
        },
      }
    );

    productsTable.grantReadData(getProductsListHandler);
    stocksTable.grantReadData(getProductsListHandler);

    const getProductsListIntegration = new apiGateway.LambdaIntegration(
      getProductsListHandler
    );
    productsResource.addMethod("GET", getProductsListIntegration);

    // get one
    const getProductHandler = new lambda.Function(this, "GetProductHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("lambda"),
      // I'd prefer get-product.handler but by the task description function name should be getProduct
      handler: "get-product.getProduct",

      environment: {
        PRODUCTS_TABLE_NAME: process.env.PRODUCTS_TABLE_NAME as string,
        STOCKS_TABLE_NAME: process.env.STOCKS_TABLE_NAME as string,
      },
    });

    const productByIdResource = productsResource.addResource("{id}");

    const getProductIntegration = new apiGateway.LambdaIntegration(
      getProductHandler
    );
    productByIdResource.addMethod("GET", getProductIntegration);

    productsTable.grantReadData(getProductHandler);
    stocksTable.grantReadData(getProductHandler);
  }
}
