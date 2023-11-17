import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsApi = new apiGateway.RestApi(this, "products-api", {
      restApiName: "Products Service",
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
      }
    );

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
    });

    const productByIdResource = productsResource.addResource("{id}");

    const getProductIntegration = new apiGateway.LambdaIntegration(
      getProductHandler
    );
    productByIdResource.addMethod("GET", getProductIntegration);
  }
}
