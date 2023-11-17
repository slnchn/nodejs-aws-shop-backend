import { getProduct } from "../../lambda/get-product";
import * as productsRepository from "../../lambda/products-data/products-repository";

test("getProduct returns product", async () => {
  const response = await getProduct({ pathParameters: { id: "1" } } as any);
  expect(response.statusCode).toBe(200);
  expect(response.body).toBeDefined();

  const body = JSON.parse(response.body);
  expect(body.product).toBeDefined();
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
  const body = JSON.parse(response.body);
  const productFromRepo = await productsRepository.getProduct("1");

  expect(body.product.id).toBe(productFromRepo?.id);
  expect(body.product.title).toBe(productFromRepo?.title);
  expect(body.product.description).toBe(productFromRepo?.description);
  expect(body.product.price).toBe(productFromRepo?.price);
});
