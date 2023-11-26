const { config } = require("dotenv");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");

const { createBatchWriteParamsList } = require("./utils");

// data
const products = require("./products-data.json");
const stocks = require("./stocks-data.json");

config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamoDb = DynamoDBDocument.from(client);

(async () => {
  try {
    const list = createBatchWriteParamsList(products, stocks);

    // taking max 3 batches because I want to be sure that I'm not going to create billions of items
    // it won't be, but I'm just a bit paranoid :p
    const paramsList = list.slice(0, 3);
    paramsList.forEach(async (params) => {
      await dynamoDb.batchWrite(params);
    });
  } catch (error) {
    console.error(error);
  }
})();
