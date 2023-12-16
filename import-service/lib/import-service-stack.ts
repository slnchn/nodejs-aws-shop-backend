import * as path from "node:path";

import { config } from "dotenv";

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodeLambda from "aws-cdk-lib/aws-lambda-nodejs";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import * as sqs from "aws-cdk-lib/aws-sqs";

config();

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(
      this,
      "Import Bucket",
      process.env.BUCKET_NAME as string
    );

    const basicAuthLambda = lambda.Function.fromFunctionArn(
      this,
      "BasicAuthorizer",
      process.env.AUTH_LAMBDA_ARN as string
    );

    const invokeTokenAuthoriserRole = new iam.Role(this, "Role", {
      roleName: "InvokeTokenAuthoriserRole",
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });

    const invokeTokenAuthoriserPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      sid: "AllowInvokeLambda",
      resources: [basicAuthLambda.functionArn],
      actions: ["lambda:InvokeFunction"],
    });

    const policy = new iam.Policy(this, "Policy", {
      policyName: "InvokeTokenAuthoriserPolicy",
      roles: [invokeTokenAuthoriserRole],
      statements: [invokeTokenAuthoriserPolicyStatement],
    });

    const authorizer = new apiGateway.TokenAuthorizer(this, "TokenAuthoriser", {
      handler: basicAuthLambda,
      assumeRole: invokeTokenAuthoriserRole,
    });

    const importApi = new apiGateway.RestApi(this, "import-api", {
      restApiName: "Import Service",
      defaultCorsPreflightOptions: {
        allowHeaders: ["*"],
        allowOrigins: ["*"],
        allowMethods: apiGateway.Cors.ALL_METHODS,
      },
    });

    new apiGateway.CfnGatewayResponse(this, "APIGatewayResponseDefault4XX", {
      restApiId: importApi.restApiId,
      responseType: "DEFAULT_4XX",
      responseParameters: {
        "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'*'",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'*'",
      },
      statusCode: "401",
    });

    new apiGateway.CfnGatewayResponse(this, "APIGatewayResponseDefault5XX", {
      restApiId: importApi.restApiId,
      responseType: "DEFAULT_5XX",
      responseParameters: {
        "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'*'",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'*'",
      },
      statusCode: "403",
    });

    const importProductsFileResource = importApi.root.addResource("import");

    // import products file
    const importProductsFileHandler = new lambda.Function(
      this,
      "ImportProductsFileHandler",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("lambda"),
        handler: "import-products-file.importProductsFile",

        environment: {
          REGION: process.env.AWS_REGION as string,
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
      authorizer,
    });

    bucket.grantRead(importProductsFileHandler);
    bucket.grantWrite(importProductsFileHandler);

    // import file parser
    const catalogBatchProcessQueue = sqs.Queue.fromQueueArn(
      this,
      "CatalogBatchProcessQueue",
      process.env.CATALOG_BATCH_PROCESS_QUEUE_ARN as string
    );

    const importFileParserLambda = new nodeLambda.NodejsFunction(
      this,
      "ImportFileParserLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, "../lambda/import-file-parser.ts"),
        handler: "index.importFileParser",

        environment: {
          REGION: process.env.AWS_REGION as string,
          BUCKET_NAME: process.env.BUCKET_NAME as string,
          SQS_URL: catalogBatchProcessQueue.queueUrl,
        },
      }
    );

    importFileParserLambda.addEventSource(
      new S3EventSource(bucket as s3.Bucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ prefix: "uploaded/", suffix: ".csv" }],
      })
    );

    bucket.grantRead(importFileParserLambda);
    bucket.grantWrite(importFileParserLambda);
    bucket.grantDelete(importFileParserLambda);
    catalogBatchProcessQueue.grantSendMessages(importFileParserLambda);
  }
}
