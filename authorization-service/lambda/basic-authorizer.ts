import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";

type PolicyEffect = "Allow" | "Deny";

const generatePolicy = (
  principalId: string,
  effect: PolicyEffect,
  resource: string
) => ({
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
  const buff = Buffer.from(token, "base64");
  const [username, password] = buff.toString("utf-8").split(":");
  return { username, password };
};

export const basicAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent
) => {
  try {
    if (!event.authorizationToken) {
      return generatePolicy("user", "Deny", event.methodArn);
    }

    const { username, password } = decodeToken(event.authorizationToken);
    const storedUserPassword = process.env[username];
    if (storedUserPassword && storedUserPassword === password) {
      return generatePolicy("user", "Allow", event.methodArn);
    }

    return generatePolicy("user", "Deny", event.methodArn);
  } catch (error) {
    console.log(error);
    return generatePolicy("user", "Deny", event.methodArn);
  }
};
