import { Readable } from "node:stream";

import csvParser from "csv-parser";

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import { SQSClient, SendMessageBatchCommand } from "@aws-sdk/client-sqs";

import { logInfo } from "../utils/logger";
import { chunkArray } from "../utils/core-utils";

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

export const getEntriesFromStream = async (stream: Readable) => {
  const entries: any[] = [];

  const onDataCallback = (data: any) => {
    entries.push(data);
  };

  await processCsvStream(stream, onDataCallback);

  return entries;
};

export const sendSqsBatch = async (entries: any[]) => {
  const sqsClient = new SQSClient({
    region: process.env.REGION,
  });

  const chunkedEntries = chunkArray(entries, 10);
  const promises = chunkedEntries.map((chunk, chunkIndex) => {
    const sqsMessages = chunk.map((entry, entryIndex) => ({
      Id: `${chunkIndex}-${entryIndex}`,
      MessageBody: JSON.stringify({
        id: entry.id,
        title: entry.title,
        description: entry.description,
        price: Number(entry.price),
        count: Number(entry.count),
      }),
    }));

    logInfo("sendSqsBatch", `Sending batch: ${JSON.stringify(sqsMessages)}`);

    const sqsBatchMessage = {
      Entries: sqsMessages,
      QueueUrl: process.env.SQS_URL as string,
    };

    const sendMessageBatchCommand = new SendMessageBatchCommand(
      sqsBatchMessage
    );

    return sqsClient.send(sendMessageBatchCommand);
  });

  await Promise.all(promises);
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
