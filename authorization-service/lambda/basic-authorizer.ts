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

const decodeToken = (token: string) => {
  const [type, value] = token.split(" ");
  if (type !== "Basic" && !value) {
    throw new Error("Expected a Basic token");
  }

  const buff = Buffer.from(value, "base64");
  const [username, password] = buff.toString("utf-8").split(":");
  return { username, password };
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

    const { username, password } = decodeToken(event.authorizationToken);
    const storedUserPassword = process.env[username];
    if (storedUserPassword && storedUserPassword === password) {
      const policy = generatePolicy("user", "Allow", event.methodArn);
      logInfo("basicAuthorizer", "Auth successful");
      return callback(null, policy);
    }

    logInfo("basicAuthorizer", "Auth failed");
    const policy = generatePolicy("user", "Deny", event.methodArn);
    return callback(null, policy);
  } catch (error) {
    if (error instanceof Error) {
      logError("basicAuthorizer", error.message);
    }

    return callback(
      `Unauthorized: ${error instanceof Error ? error.message : ""}`
    );
  }
};
