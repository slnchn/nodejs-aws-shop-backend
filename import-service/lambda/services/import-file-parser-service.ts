import { Readable } from "node:stream";

const csvParser = require("csv-parser");

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";

const getBucketAndKey = (event: S3Event) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );

  return { bucket, key };
};

export const getFileStream = async (
  event: S3Event
): Promise<Readable | null> => {
  try {
    const { bucket, key } = getBucketAndKey(event);

    const s3Client = new S3Client({
      region: process.env.REGION,
    });

    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const item = await s3Client.send(getObjectCommand);
    if (item.Body) {
      return item.Body as Readable;
    }

    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const logFileStream = (stream: Readable) =>
  new Promise((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on("data", (data: any) => console.info(`IMPORT FILE PARSER::`, data))
      .on("end", () => resolve({ success: true }))
      .on("error", (error: Error) => reject({ success: false, error }));
  });

export const moveFileToParsed = async (event: S3Event) => {
  try {
    const { bucket, key } = getBucketAndKey(event);

    const s3Client = new S3Client({
      region: process.env.REGION,
    });

    const copyObjectCommand = new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${key}`,
      Key: key.replace("uploaded", "parsed"),
    });

    await s3Client.send(copyObjectCommand);

    const deleteObjectCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(deleteObjectCommand);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
};
