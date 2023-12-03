import * as path from "node:path";
import * as fs from "node:fs";
import { Readable } from "node:stream";

import { config } from "dotenv";

import { S3Event } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import {
  getFileStream,
  logFileStream,
  moveFileToParsed,
} from "../../../lambda/services/import-file-parser-service";

config();

jest.mock("@aws-sdk/client-s3");

describe("getFileStream", () => {
  it("returns a Readable stream when the S3 object exists", async () => {
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({
        Body: new Readable(),
      }),
    }));

    (GetObjectCommand as unknown as jest.Mock).mockImplementation(() => ({}));

    const mockEvent: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: "aws-bucket",
            },
            object: {
              key: "uploaded/products.csv",
            },
          },
        },
      ],
    } as S3Event;

    const result = await getFileStream(mockEvent);
    expect(result).toBeInstanceOf(Readable);
  });

  it("returns null when the S3 object does not exist", async () => {
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    }));

    (GetObjectCommand as unknown as jest.Mock).mockImplementation(() => ({}));

    const mockEvent: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: "aws-bucket",
            },
            object: {
              key: "uploaded/products.csv",
            },
          },
        },
      ],
    } as S3Event;

    const result = await getFileStream(mockEvent);
    expect(result).toBeNull();
  });

  it("returns null when in case of error", async () => {
    (S3Client as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockRejectedValue(new Error("test")),
    }));

    (GetObjectCommand as unknown as jest.Mock).mockImplementation(() => ({}));

    const mockEvent: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: "aws-bucket",
            },
            object: {
              key: "uploaded/products.csv",
            },
          },
        },
      ],
    } as S3Event;

    const result = await getFileStream(mockEvent);
    expect(result).toBeNull();
  });
});

describe("logFileStream", () => {
  const mockData = [
    { id: "1", title: "test1" },
    { id: "2", title: "test2" },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("resolves with success: true when the stream is successfully logged", async () => {
    const mockStream = new Readable();
    mockStream.push(JSON.stringify(mockData[0]));
    mockStream.push(JSON.stringify(mockData[1]));
    mockStream.push(null);
    const result = await logFileStream(mockStream);
    expect(result).toEqual({ success: true });
  });

  it("calls console.info for each row in the stream", async () => {
    const mockStream = fs.createReadStream(
      path.resolve(__dirname, "products.csv")
    );

    const mockInfo = jest.spyOn(console, "info");

    await logFileStream(mockStream);

    expect(mockInfo).toHaveBeenCalledTimes(2);
  });

  // it("resolves with success: false and error when the stream is not successfully logged", async () => {
  //   const mockStream = new Readable();

  //   mockStream.pipe = jest.fn().mockImplementation(() => {
  //     throw new Error("test");
  //   });

  //   // check if rejects with success: false
  //   await expect(logFileStream(mockStream)).rejects.toEqual({
  //     success: false,
  //     error: "test",
  //   });
  // });
});

describe("moveFileToParsed", () => {
  it("should call CopyObjectCommand with correct params", async () => {
    const mockEvent: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: "aws-bucket",
            },
            object: {
              key: "uploaded/products.csv",
            },
          },
        },
      ],
    } as S3Event;

    (S3Client as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    }));

    (CopyObjectCommand as unknown as jest.Mock).mockImplementation(() => ({}));

    await moveFileToParsed(mockEvent);

    expect(CopyObjectCommand).toHaveBeenCalledWith({
      Bucket: "aws-bucket",
      CopySource: "aws-bucket/uploaded/products.csv",
      Key: "parsed/products.csv",
    });
  });

  it("should call DeleteObjectCommand with correct params", async () => {
    const mockEvent: S3Event = {
      Records: [
        {
          s3: {
            bucket: {
              name: "aws-bucket",
            },
            object: {
              key: "uploaded/products.csv",
            },
          },
        },
      ],
    } as S3Event;

    (S3Client as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    }));

    (DeleteObjectCommand as unknown as jest.Mock).mockImplementation(
      () => ({})
    );

    await moveFileToParsed(mockEvent);

    expect(DeleteObjectCommand).toHaveBeenCalledWith({
      Bucket: "aws-bucket",
      Key: "uploaded/products.csv",
    });
  });
});
