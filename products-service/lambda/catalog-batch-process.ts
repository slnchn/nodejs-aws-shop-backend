import { SQSEvent } from "aws-lambda";

import { logError, logInfo } from "./logger";
import { getValidBody } from "./utils";
import { validateCreateProduct } from "./validators/validate-create-product";
import { ProductStock } from "./products-data/products-data";
import { createProductStock } from "./products-data/products-repository";
import {
  buildProductStock,
  sendProductStockEmail,
} from "./services/create-product-service";

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

      const validationResult = validateCreateProduct(validBody as ProductStock);

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

    const records = event.Records;
    if (!records || !records.length) {
      logError("catalogBatchProcess", "No records provided");
      return;
    }

    const { validRecords, invalidRecords } = getRecords(records);
    if (invalidRecords.length) {
      logError(
        "catalogBatchProcess",
        `Invalid records provided: ${JSON.stringify(invalidRecords)}`
      );
    }

    logInfo("catalogBatchProcess", "All records are valid");

    const promises = validRecords.map(async (record) => {
      const productStock = buildProductStock(record);

      logInfo("catalogBatchProcess", `${JSON.stringify(record)}`);
      logInfo("catalogBatchProcess", `${productStock}`);

      await createProductStock(productStock);

      // just a notification, no need to wait for it
      sendProductStockEmail(productStock);
    });

    await Promise.all(promises);

    logInfo("catalogBatchProcess", "All records were processed");
  } catch (error) {
    if (error instanceof Error) {
      logError(
        "catalogBatchProcess",
        `Error while processing catalog batch: ${error.message}`
      );
    }
  }
};
