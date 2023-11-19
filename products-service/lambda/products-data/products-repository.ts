import { products } from "./products-data";

export const listProducts = async () => {
  return products;
};

export const getProduct = async (id: string) => {
  return products.find((product) => product.id === id);
};
