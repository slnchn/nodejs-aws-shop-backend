import { config } from "dotenv";

import { APIGatewayProxyEvent } from "aws-lambda";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { importProductsFile } from "../../lambda/import-products-file";

config();

jest.mock("@aws-sdk/client-s3");

jest.mock("@aws-sdk/s3-request-presigner");

describe("importProductsFile", () => {
  let mockEvent: APIGatewayProxyEvent;

  beforeEach(() => {
    mockEvent = {
      queryStringParameters: {
        name: "products.csv",
      },
    } as unknown as APIGatewayProxyEvent;
  });

  it("should return 400 if name query parameter is not provided", async () => {
    mockEvent.queryStringParameters!.name = undefined;
    const response = await importProductsFile(mockEvent);
    expect(response.statusCode).toBe(400);
  });

  it("should return 400 if name query parameter does not match .csv", async () => {
    mockEvent.queryStringParameters!.name = "products.txt";
    const response = await importProductsFile(mockEvent);
    expect(response.statusCode).toBe(400);
  });

  it("should return 200 if PutObjectCommand is successful", async () => {
    (PutObjectCommand as unknown as jest.Mock).mockResolvedValue({});
    (getSignedUrl as jest.Mock).mockResolvedValue("signedUrl");
    const response = await importProductsFile(mockEvent);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe("signedUrl");
  });

  it("should return 500 if PutObjectCommand throws an error", async () => {
    (getSignedUrl as unknown as jest.Mock).mockRejectedValue(new Error("test"));

    const response = await importProductsFile(mockEvent);
    expect(response.statusCode).toBe(500);
  });
});
