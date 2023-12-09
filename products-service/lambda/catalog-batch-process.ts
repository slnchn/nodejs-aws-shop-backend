import { SQSEvent, SQSRecord } from "aws-lambda";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

import { logError, logInfo } from "./logger";
import { buildResponse, getValidBody } from "./utils";
import { validateCreateProduct } from "./validators/validate-create-product";
import { ProductStock } from "./products-data/products-data";
import { createProductStock } from "./products-data/products-repository";

type GetRecordsResult = {
  validRecords: ProductStock[];
  invalidRecords: any[];
};

const getRecords = (records: SQSEvent["Records"]) =>
  records.reduce<GetRecordsResult>(
    (acc, record) => {
      const validBody = getValidBody(record.body);
      if (!validBody) {
        return {
          validRecords: acc.validRecords,
          invalidRecords: [...acc.invalidRecords, record],
        };
      }

      const validationResult = validateCreateProduct(
        validBody as ProductStock,
        { extraFields: ["id"] }
      );

      if (!validationResult.success) {
        logError(
          "catalogBatchProcess",
          `Invalid record provided: ${JSON.stringify(
            validBody
          )} ${validationResult.errors.join(", ")}`
        );
        return {
          validRecords: acc.validRecords,
          invalidRecords: [...acc.invalidRecords, validBody],
        };
      }

      return {
        validRecords: [...acc.validRecords, validBody as ProductStock],
        invalidRecords: acc.invalidRecords,
      };
    },
    {
      validRecords: [],
      invalidRecords: [],
    }
  );

export const catalogBatchProcess = async (event: SQSEvent) => {
  try {
    logInfo("catalogBatchProcess", "Processing catalog batch");

    // if at least one record is invalid, return 400

    const records = event.Records;
    if (!records || !records.length) {
      logError("catalogBatchProcess", "No records provided");
      return buildResponse(400, { message: "No records provided" });
    }

    const { validRecords, invalidRecords } = getRecords(records);
    if (invalidRecords.length) {
      logError(
        "catalogBatchProcess",
        `Invalid records provided: ${JSON.stringify(invalidRecords)}`
      );

      return buildResponse(400, {
        message: "Bad Request",
        errors: invalidRecords.map((record) => record.body),
      });
    }

    logInfo("catalogBatchProcess", "All records are valid");

    const sns = new SNSClient();

    const promises = validRecords.map((record) => {
      const { id, title, description, price, count } = record;
      logInfo("record", `${JSON.stringify(record)}`);
      logInfo(
        "create product stock",
        `${{ id, title, description, price, count }}`
      );
      return createProductStock({ id, title, description, price, count });
    });

    await Promise.all(promises);

    await sns.send(
      new PublishCommand({
        TopicArn: process.env.SNS_ARN as string,
        Message: `New products were added: ${validRecords
          .map((record) => record.title)
          .join(", ")}`,
      })
    );

    return buildResponse(200, { message: "OK" });
  } catch (error) {
    if (error instanceof Error) {
      logError(
        "catalogBatchProcess",
        `Error while processing catalog batch: ${error.message}`
      );
    }

    return buildResponse(500, { message: "Internal server error" });
  }
};
