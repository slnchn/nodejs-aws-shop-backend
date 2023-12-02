import { config } from "dotenv";

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

config();

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(
      this,
      "Import Bucket",
      process.env.BUCKET_NAME as string
    );

    const importApi = new apiGateway.RestApi(this, "import-api", {
      restApiName: "Import Service",
      defaultCorsPreflightOptions: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: apiGateway.Cors.ALL_METHODS,
      },
    });

    const importProductsFileResource = importApi.root.addResource("import");

    const importProductsFileHandler = new lambda.Function(
      this,
      "ImportProductsFileHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "import-products-file.importProductsFile",

        environment: {
          BUCKET_NAME: process.env.BUCKET_NAME as string,
        },
      }
    );

    const importProductsFileIntegration = new apiGateway.LambdaIntegration(
      importProductsFileHandler
    );

    importProductsFileResource.addMethod("GET", importProductsFileIntegration, {
      requestParameters: {
        "method.request.querystring.name": true,
      },
    });

    bucket.grantRead(importProductsFileHandler);
    bucket.grantWrite(importProductsFileHandler);
  }
}
