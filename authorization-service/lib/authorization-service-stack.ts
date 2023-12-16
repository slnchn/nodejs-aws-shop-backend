import * as path from "node:path";

import { config } from "dotenv";

import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodeLambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

config();

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new nodeLambda.NodejsFunction(this, "BasicAuthorizerLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../lambda/basic-authorizer.ts"),
      handler: "index.basicAuthorizer",

      environment: {
        slnchn: process.env.slnchn as string,
      },
    });
  }
}
