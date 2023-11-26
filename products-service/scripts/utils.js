const MAX_OPERATIONS_PER_BATCH = 25;
const OPERATIONS_ADDED_PER_ITERATION = 2;

const createEmptyBatchWriteParams = () => ({
  RequestItems: {
    [process.env.PRODUCTS_TABLE_NAME]: [],
    [process.env.STOCKS_TABLE_NAME]: [],
  },
});

/**
 *
 * @description
 * Creates _a list_ of batches.
 * The `dynamoDb.batchWrite` has a limitation of 25 operations per batch.
 * I have 13 products and 13 stocks -> I need to make 26 operations -> `dynamoDb.batchWrite` fails for me.
 * So I ended up with creating a function that creates a list of batches, and each batch has less than 25 operations.
 * Sorry for making review process harder with more logic, but without chunking the batches it looked incomplete to me.
 *
 * @param {Array} products - The list of products.
 * @param {Array} stocks - The list of stocks.
 * @returns {Array} resultBatches - The list of batches with write parameters.
 */
const createBatchWriteParamsList = (products, stocks) => {
  const resultBatches = [createEmptyBatchWriteParams()];
  let currentBatchIndex = 0;

  products.forEach(async (product) => {
    const productsOperationsCount =
      resultBatches[currentBatchIndex].RequestItems[
        process.env.PRODUCTS_TABLE_NAME
      ].length;

    const stocksOperationsCount =
      resultBatches[currentBatchIndex].RequestItems[
        process.env.STOCKS_TABLE_NAME
      ].length;

    if (
      productsOperationsCount +
        stocksOperationsCount +
        OPERATIONS_ADDED_PER_ITERATION >=
      MAX_OPERATIONS_PER_BATCH
    ) {
      resultBatches.push(createEmptyBatchWriteParams());
      currentBatchIndex++;
    }

    const params = resultBatches[currentBatchIndex];
    const stock = stocks.find((stock) => stock.product_id === product.id);
    if (product && stock) {
      params.RequestItems[process.env.PRODUCTS_TABLE_NAME].push({
        PutRequest: {
          Item: product,
        },
      });

      params.RequestItems[process.env.STOCKS_TABLE_NAME].push({
        PutRequest: {
          Item: stock,
        },
      });
    }
  });

  return resultBatches;
};

module.exports = {
  createBatchWriteParamsList,
};
