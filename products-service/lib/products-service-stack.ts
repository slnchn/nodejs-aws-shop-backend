import path = require("node:path");

import { config } from "dotenv";

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodeLambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { EmailSubscription } from "aws-cdk-lib/aws-sns-subscriptions";

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

    // create
    const createProductHandler = new lambda.Function(
      this,
      "CreateProductHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "create-product.createProduct",

        environment: {
          PRODUCTS_TABLE_NAME: process.env.PRODUCTS_TABLE_NAME as string,
          STOCKS_TABLE_NAME: process.env.STOCKS_TABLE_NAME as string,
        },
      }
    );

    const createProductIntegration = new apiGateway.LambdaIntegration(
      createProductHandler
    );
    productsResource.addMethod("POST", createProductIntegration);

    productsTable.grantWriteData(createProductHandler);
    stocksTable.grantWriteData(createProductHandler);

    // catalog batch process
    const catalogBatchProcessQueue = new sqs.Queue(
      this,
      "CatalogBatchProcessQueue",
      {
        queueName: "catalogItemsQueue",
      }
    );

    const catalogBatchProcessSnsTopic = new sns.Topic(
      this,
      "CatalogBatchProcessSnsTopic",
      {
        topicName: "createProductTopic",
      }
    );

    const COUNT_FILTER_BORDER = 5;

    catalogBatchProcessSnsTopic.addSubscription(
      new EmailSubscription(process.env.MY_EMAIL as string, {
        filterPolicy: {
          count: sns.SubscriptionFilter.numericFilter({
            lessThan: COUNT_FILTER_BORDER,
          }),
        },
      })
    );

    catalogBatchProcessSnsTopic.addSubscription(
      new EmailSubscription(process.env.MY_ANOTHER_EMAIL as string, {
        filterPolicy: {
          count: sns.SubscriptionFilter.numericFilter({
            greaterThanOrEqualTo: COUNT_FILTER_BORDER,
          }),
        },
      })
    );

    const catalogBatchProcessHandler = new nodeLambda.NodejsFunction(
      this,
      "CatalogBatchProcessHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, "../lambda/catalog-batch-process.ts"),
        handler: "index.catalogBatchProcess",

        environment: {
          PRODUCTS_TABLE_NAME: process.env.PRODUCTS_TABLE_NAME as string,
          STOCKS_TABLE_NAME: process.env.STOCKS_TABLE_NAME as string,
          SNS_ARN: catalogBatchProcessSnsTopic.topicArn,
        },
      }
    );

    catalogBatchProcessHandler.addEventSource(
      new SqsEventSource(catalogBatchProcessQueue, {
        batchSize: 5,
      })
    );

    productsTable.grantWriteData(catalogBatchProcessHandler);
    stocksTable.grantWriteData(catalogBatchProcessHandler);
    catalogBatchProcessSnsTopic.grantPublish(catalogBatchProcessHandler);
  }
}
