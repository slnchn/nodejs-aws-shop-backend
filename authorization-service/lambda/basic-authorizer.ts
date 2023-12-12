import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

export const basicAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent
) => {
  if (!event.authorizationToken) {
    throw new Error("Unauthorized");
  }

  const encodedCreds = event.authorizationToken.split(" ")[1];
  const buff = Buffer.from(encodedCreds, "base64");
  const [username, password] = buff.toString("utf-8").split(":");

  const storedUserPassword = process.env[username];
  if (!storedUserPassword || storedUserPassword !== password) {
    throw new Error("Forbidden");
  }

  return {
    principalId: username,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: "Allow",
          Resource: "*",
        },
      ],
    },
  };
};
