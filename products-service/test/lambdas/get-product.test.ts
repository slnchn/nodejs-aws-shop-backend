import { getProduct } from "../../lambda/get-product";
import * as productsRepository from "../../lambda/products-data/products-repository";

test("getProduct returns product", async () => {
  const response = await getProduct({ pathParameters: { id: "1" } } as any);
  expect(response.statusCode).toBe(200);
  expect(response.body).toBeDefined();

  const body = JSON.parse(response.body);
  expect(body).toBeDefined();
  expect(body.id).toBeDefined();
  expect(body.title).toBeDefined();
  expect(body.description).toBeDefined();
  expect(body.price).toBeDefined();
});

test("getProduct returns 404 if product not found", async () => {
  const response = await getProduct({ pathParameters: { id: "999" } } as any);
  expect(response.statusCode).toBe(404);
  expect(response.body).toBeDefined();

  const body = JSON.parse(response.body);
  expect(body.message).toBe("Product not found");
});

test("getProduct returns correct data", async () => {
  const response = await getProduct({ pathParameters: { id: "1" } } as any);
  const product = JSON.parse(response.body);
  const productFromRepo = await productsRepository.getProduct("1");

  expect(product.id).toBe(productFromRepo?.id);
  expect(product.title).toBe(productFromRepo?.title);
  expect(product.description).toBe(productFromRepo?.description);
  expect(product.price).toBe(productFromRepo?.price);
});
