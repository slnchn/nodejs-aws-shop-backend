import {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
  Callback,
  Context,
} from "aws-lambda";

import { logInfo, logError } from "../../utils/logger";

type PolicyEffect = "Allow" | "Deny";

const generatePolicy = (
  principalId: string,
  effect: PolicyEffect,
  resource: string
): APIGatewayAuthorizerResult => ({
  principalId,
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: resource,
      },
    ],
  },
});

type DecodeTokenResult =
  | {
      success: true;
      username: string;
      password: string;
    }
  | {
      success: false;
      error: string;
    };

const decodeToken = (token: string): DecodeTokenResult => {
  try {
    const [type, value] = token.split(" ");
    if (type !== "Basic") {
      return { success: false, error: "Not Basic token" };
    }

    if (!value) {
      return { success: false, error: "No value provided" };
    }

    const buff = Buffer.from(value, "base64");
    const [username, password] = buff.toString("utf-8").split(":");
    return { success: true, username, password };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Unknown error of token decoding" };
  }
};

export const basicAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context,
  callback: Callback
) => {
  try {
    logInfo("basicAuthorizer", "Authorizing user");
    if (!event.authorizationToken) {
      logError("basicAuthorizer", "No token provided");
      return callback("Unauthorized");
    }

    logInfo("basicAuthorizer", event.authorizationToken);
    logInfo("basicAuthorizer", `Decoding token: ${event.authorizationToken}`);
    const result = decodeToken(event.authorizationToken);
    if (!result.success) {
      logError("basicAuthorizer", result.error);
      return callback("Unauthorized");
    }

    const { username, password } = result;
    const storedUserPassword = process.env[username];
    if (storedUserPassword && storedUserPassword === password) {
      logInfo("basicAuthorizer", "Auth successful");
      const policy = generatePolicy("user", "Allow", event.methodArn);
      return callback(null, policy);
    }

    if (!storedUserPassword) {
      logError("basicAuthorizer", `User ${username} not found`);
      const policy = generatePolicy("user", "Deny", event.methodArn);
      return callback(null, policy);
    }

    if (storedUserPassword !== password) {
      logError("basicAuthorizer", `Invalid password for user ${username}`);
      const policy = generatePolicy("user", "Deny", event.methodArn);
      return callback(null, policy);
    }

    logError(
      "basicAuthorizer",
      "Defaulting to unauthorized (Something weird happened)"
    );
    return callback("Unauthorized");
  } catch (error) {
    if (error instanceof Error) {
      logError("basicAuthorizer", error.message);
    }

    return callback(
      `Unauthorized: ${error instanceof Error ? error.message : ""}`
    );
  }
};
