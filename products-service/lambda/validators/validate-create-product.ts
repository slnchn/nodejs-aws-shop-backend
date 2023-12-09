import { CreateProductParams } from "../products-data/products-data";
import { getDecimalPlacesCount, validateString } from "./validator-utils";

type ValidationResult =
  | {
      success: true;
    }
  | {
      success: false;
      errors: string[];
    };

const PRODUCT_TITLE_MIN_LENGTH = 3;
const PRODUCT_TITLE_MAX_LENGTH = 63;

const PRODUCT_DESCRIPTION_MIN_LENGTH = 0;
const PRODUCT_DESCRIPTION_MAX_LENGTH = 255;

const PRODUCT_PRICE_MIN = 0;
const PRODUCT_PRICE_MAX = 999999.99;
const PRODUCT_PRICE_MAX_DECIMAL_PLACES = 2;

const PRODUCT_COUNT_MIN = 0;
const PRODUCT_COUNT_MAX = 999999;

const validFields = ["title", "description", "price", "count"];

const validateTitle = (title: string): string[] => {
  const errors: string[] = [];

  const titleErrors = validateString({
    value: title,
    valueName: "Title",
    minLength: PRODUCT_TITLE_MIN_LENGTH,
    maxLength: PRODUCT_TITLE_MAX_LENGTH,
  });

  errors.push(...titleErrors);

  return errors;
};

const validateDescription = (description: string): string[] => {
  const errors: string[] = [];

  const descriptionErrors = validateString({
    value: description,
    valueName: "Description",
    minLength: PRODUCT_DESCRIPTION_MIN_LENGTH,
    maxLength: PRODUCT_DESCRIPTION_MAX_LENGTH,
  });

  errors.push(...descriptionErrors);

  return errors;
};

const validatePrice = (price: number): string[] => {
  const errors: string[] = [];

  if (typeof price !== "number") {
    errors.push("Price must be a number");
    return errors;
  }

  if (price <= PRODUCT_PRICE_MIN) {
    errors.push(`Price must be greater than ${PRODUCT_PRICE_MIN}`);
  }

  if (price > PRODUCT_PRICE_MAX) {
    errors.push(`Price must be ${PRODUCT_PRICE_MAX} or less`);
  }

  if (getDecimalPlacesCount(price) > PRODUCT_PRICE_MAX_DECIMAL_PLACES) {
    errors.push(
      `Price must have no more than ${PRODUCT_PRICE_MAX_DECIMAL_PLACES} decimal places`
    );
  }

  return errors;
};

const validateCount = (count: number): string[] => {
  const errors: string[] = [];

  if (typeof count !== "number") {
    errors.push("Count must be a number");
    return errors;
  }

  if (count <= PRODUCT_COUNT_MIN) {
    errors.push(`Count must be greater than ${PRODUCT_COUNT_MIN}`);
  }

  if (count > PRODUCT_COUNT_MAX) {
    errors.push(`Count must be ${PRODUCT_COUNT_MAX} or less`);
  }

  if (!Number.isInteger(count)) {
    errors.push("Count must be an integer");
  }

  return errors;
};

type ValidateCreateProductOptions = {
  extraFields?: string[];
};

export const validateCreateProduct = (
  product: CreateProductParams,
  options?: ValidateCreateProductOptions
): ValidationResult => {
  const errors: string[] = [];

  if (product.title === undefined) {
    errors.push("Title is required");
  } else {
    const titleErrors = validateTitle(product.title);
    errors.push(...titleErrors);
  }

  if (product.description !== undefined) {
    const descriptionErrors = validateDescription(product.description);
    errors.push(...descriptionErrors);
  }

  if (product.price === undefined) {
    errors.push("Price is required");
  } else {
    const priceErrors = validatePrice(product.price);
    errors.push(...priceErrors);
  }

  if (product.count === undefined) {
    errors.push("Count is required");
  } else {
    const countErrors = validateCount(product.count);
    errors.push(...countErrors);
  }

  const fields = [...validFields, ...(options?.extraFields || [])];
  const unknownFields = Object.keys(product).filter(
    (key) => !fields.includes(key)
  );

  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }

  if (errors.length > 0) {
    return { success: false, errors: errors };
  }

  return { success: true };
};
