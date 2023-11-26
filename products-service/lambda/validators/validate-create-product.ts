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
  }

  if (count < PRODUCT_COUNT_MIN) {
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

export const validateCreateProduct = (
  product: CreateProductParams
): ValidationResult => {
  const errors: string[] = [];

  if (product.title) {
    const titleErrors = validateTitle(product.title);
    errors.push(...titleErrors);
  } else {
    errors.push("Title is required");
  }

  if (product.description) {
    const descriptionErrors = validateDescription(product.description);
    errors.push(...descriptionErrors);
  }

  if (product.price) {
    const priceErrors = validatePrice(product.price);
    errors.push(...priceErrors);
  } else {
    errors.push("Price is required");
  }

  if (product.count) {
    const countErrors = validateCount(product.count);
    errors.push(...countErrors);
  } else {
    errors.push("Count is required");
  }

  if (errors.length > 0) {
    return { success: false, errors: errors };
  }

  return { success: true };
};
