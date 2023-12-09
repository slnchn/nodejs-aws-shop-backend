import { Readable } from "node:stream";

import csvParser from "csv-parser";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { logInfo } from "../utils/logger";

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
    if (error instanceof Error) {
      console.error(error.message);
    }

    return null;
  }
};

const processCsvStream = (
  stream: Readable,
  onDataCallback: (data: any) => any
) =>
  new Promise((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on("data", onDataCallback)
      .on("end", () => resolve({ success: true }))
      .on("error", (error: Error) => {
        console.error(error.message);
        reject({ success: false, error: error.message });
      });
  });

export const logFileStream = (stream: Readable) =>
  processCsvStream(stream, (data: any) =>
    console.info(`IMPORT FILE PARSER::`, data)
  );

export const sendToSQS = async (stream: Readable) => {
  const sqsClient = new SQSClient({
    region: process.env.REGION,
  });

  const sqsUrl = process.env.SQS_URL as string;

  const onDataCallback = async (data: any) => {
    const { id, title, description, price, count } = data;
    const body = {
      id,
      title,
      description,
      price: Number(price),
      count: Number(count),
    };

    const sqsMessage = {
      MessageBody: JSON.stringify(body),
      QueueUrl: sqsUrl,
    };

    const sendMessageCommand = new SendMessageCommand(sqsMessage);

    try {
      await sqsClient.send(sendMessageCommand);
      logInfo("sendToSQS", `Message sent: ${JSON.stringify(body)}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  };

  return processCsvStream(stream, onDataCallback);
};

export const moveFileToParsed = async (event: S3Event) => {
  try {
    const { bucket, key } = getBucketAndKey(event);

    const s3Client = new S3Client({
      region: process.env.REGION,
    });

    const copyObjectCommand = new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${encodeURIComponent(key)}`,
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
    if (error instanceof Error) {
      console.error(error.message);
      return { success: false, error: error.message };
    }

    return { success: false, error: "Moving file error" };
  }
};
