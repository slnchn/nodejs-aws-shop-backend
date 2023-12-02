import { Readable } from "node:stream";

import * as csvParser from "csv-parser";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { buildResponseFromObject } from "./utils/server-utils";

const s3Client = new S3Client({
  region: process.env.REGION,
});

export const importFileParser = async (event: S3Event) => {
  try {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, " ")
    );

    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const item = await s3Client.send(getObjectCommand);
    if (item.Body instanceof Readable) {
      item.Body.pipe(csvParser()).on("data", (data: any) =>
        console.info(`IMPORT FILE PARSER::`, data)
      );
    }

    return buildResponseFromObject(200, { message: "OK, please check logs" });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }

    return buildResponseFromObject(500, { message: "Internal server error" });
  }
};
