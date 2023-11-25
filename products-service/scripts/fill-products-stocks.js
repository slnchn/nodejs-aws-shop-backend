const dotenv = require("dotenv");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");

// data
const products = require("./products-data.json");
const stocks = require("./stocks-data.json");

dotenv.config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const dynamoDb = DynamoDBDocument.from(client);

const putData = async (table, items) => {
  items.forEach(async (item) => {
    const params = {
      TableName: table,
      Item: item,
    };

    try {
      // TODO: use batch write instead
      dynamoDb.put(params, (error) => {
        if (error) {
          console.log(error);
        }
      });
    } catch (error) {
      console.log(error);
    }
  });
};

putData(process.env.PRODUCTS_TABLE_NAME, products);
putData(process.env.STOCKS_TABLE_NAME, stocks);
