import { SQSEvent } from "aws-lambda";
import { SNSClient } from "@aws-sdk/client-sns";

import * as productsRepository from "../../lambda/products-data/products-repository";
import { catalogBatchProcess } from "../../lambda/catalog-batch-process";
import { buildResponse } from "../../lambda/utils";
import { validateCreateProduct } from "../../lambda/validators/validate-create-product";

jest.mock("@aws-sdk/client-sns");
jest.mock("@aws-sdk/client-dynamodb");
jest.mock("@aws-sdk/util-dynamodb");
jest.mock("../../lambda/products-data/products-repository");
jest.mock("../../lambda/validators/validate-create-product");

describe("catalogBatchProcess", () => {
  it("should return 400 if no records provided", async () => {
    const mockEvent = {
      Records: [],
    } as unknown as SQSEvent;

    const response = await catalogBatchProcess(mockEvent);
    expect(response).toEqual(
      buildResponse(400, { message: "No records provided" })
    );
  });

  it("should return 400 if invalid records provided", async () => {
    const mockEvent = {
      Records: [
        {
          body: "invalid",
        },
      ],
    } as unknown as SQSEvent;

    const response = await catalogBatchProcess(mockEvent);
    expect(response).toEqual(
      buildResponse(400, { message: "Bad Request", errors: ["invalid"] })
    );
  });

  it("should process valid records and send notifications", async () => {
    const validRecord = {
      id: "1",
      title: "test",
      description: "test",
      price: 100,
      count: 1,
    };

    const mockEvent = {
      Records: [
        {
          body: JSON.stringify(validRecord),
        },
      ],
    } as unknown as SQSEvent;

    (SNSClient as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    }));

    (validateCreateProduct as jest.Mock).mockReturnValue({
      success: true,
    });

    const spy = jest.spyOn(productsRepository, "createProductStock");

    const response = await catalogBatchProcess(mockEvent);
    expect(response).toEqual(buildResponse(200, { message: "OK" }));
    expect(spy).toHaveBeenCalled();
  });

  it("should return 500 if an error occurs", async () => {
    const validRecord = {
      id: "1",
      title: "test",
      description: "test",
      price: 100,
      count: 1,
    };

    const mockEvent = {
      Records: [
        {
          body: JSON.stringify(validRecord),
        },
      ],
    } as unknown as SQSEvent;

    const error = new Error("test error");
    (productsRepository.createProductStock as jest.Mock).mockImplementation(
      () => {
        throw error;
      }
    );

    const response = await catalogBatchProcess(mockEvent);
    expect(response).toEqual(
      buildResponse(500, { message: "Internal server error" })
    );
  });
});
