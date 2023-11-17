import { getProductsList } from "../../lambda/get-products-list";
import * as productsRepository from "../../lambda/products-data/products-repository";

test("getProductsList response should have correct shape", async () => {
  const response = await getProductsList();
  expect(response.statusCode).toBe(200);
  expect(response.body).toBeDefined();

  const body = JSON.parse(response.body);
  expect(body.products).toBeDefined();
  expect(Object.keys(body).length).toBe(1);
});

test("getProductsList should return correct data", async () => {
  const productsFromRepo = await productsRepository.listProducts();
  const response = await getProductsList();
  const body = JSON.parse(response.body);

  body.products.forEach((product: any) => {
    const productFromRepo = productsFromRepo.find(
      (p: any) => p.id === product.id
    );

    expect(productFromRepo).toBeDefined();
    expect(productFromRepo?.title).toBe(product.title);
    expect(productFromRepo?.description).toBe(product.description);
    expect(productFromRepo?.price).toBe(product.price);
  });

  expect(body.products.length).toBe(productsFromRepo.length);
});
