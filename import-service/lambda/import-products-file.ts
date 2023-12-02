import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { buildResponse } from "./utils/server-utils";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

export const importProductsFile = async (event: APIGatewayProxyEvent) => {
  try {
    if (!event?.queryStringParameters?.name) {
      return buildResponse(400, { message: "Please provide name" });
    }

    const fileName = event.queryStringParameters.name;

    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `uploaded/${fileName}`,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    return buildResponse(200, { signedUrl });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }

    return buildResponse(500, { message: "Internal server error" });
  }
};
