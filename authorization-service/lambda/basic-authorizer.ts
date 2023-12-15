import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";

import { buildResponseFromObject } from "../../utils/server-utils";

export const basicAuthorizer = async (
  event: APIGatewayTokenAuthorizerEvent
) => {
  if (!event.authorizationToken) {
    return buildResponseFromObject(401, { message: "Token is not provided" });
  }

  const encodedCreds = event.authorizationToken.split(" ")[1];
  const buff = Buffer.from(encodedCreds, "base64");
  const [username, password] = buff.toString("utf-8").split(":");

  console.log({ username, password });

  const storedUserPassword = process.env[username];
  if (!storedUserPassword || storedUserPassword !== password) {
    return buildResponseFromObject(403, { message: "Unauthorized" });
  }

  return buildResponseFromObject(200, { message: "Authorized" });
};
