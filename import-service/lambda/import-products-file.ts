import { APIGatewayProxyEvent } from "aws-lambda";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { buildResponse, buildResponseFromObject } from "./utils/server-utils";
import { validateImportProductsFile } from "./validators/validate-import-products-file";

const s3Client = new S3Client({
  region: process.env.REGION,
});

export const importProductsFile = async (event: APIGatewayProxyEvent) => {
  try {
    // I belive it will be triggered only on new .csv file upload
    // but additional validation is always good ;)
    const validationResult = validateImportProductsFile(event);
    if (!validationResult.success) {
      return buildResponse(400, validationResult.message);
    }

    const fileName = event.queryStringParameters!.name;
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `uploaded/${fileName}`,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    return buildResponse(200, signedUrl);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }

    return buildResponseFromObject(500, { message: "Internal server error" });
  }
};
