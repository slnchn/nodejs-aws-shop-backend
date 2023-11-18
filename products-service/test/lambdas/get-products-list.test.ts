import { getProductsList } from "../../lambda/get-products-list";
import { Product } from "../../lambda/products-data/products-data";
import * as productsRepository from "../../lambda/products-data/products-repository";

test("getProductsList response should be an array of Product", async () => {
  const response = await getProductsList();
  expect(response.statusCode).toBe(200);
  expect(response.body).toBeDefined();

  const products = JSON.parse(response.body);
  products.forEach((product: Product) => {
    expect(product.id).toBeDefined();
    expect(product.title).toBeDefined();
    expect(product.description).toBeDefined();
    expect(product.price).toBeDefined();
  });
});

test("getProductsList should return correct data", async () => {
  const productsFromRepo = await productsRepository.listProducts();
  const response = await getProductsList();
  const products = JSON.parse(response.body);

  products.forEach((product: any) => {
    const productFromRepo = productsFromRepo.find(
      (p: any) => p.id === product.id
    );

    expect(productFromRepo).toBeDefined();
    expect(productFromRepo?.title).toBe(product.title);
    expect(productFromRepo?.description).toBe(product.description);
    expect(productFromRepo?.price).toBe(product.price);
  });

  expect(products.length).toBe(productsFromRepo.length);
});
