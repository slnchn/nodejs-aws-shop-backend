interface ValidateStringParams {
  value: string;
  valueName: string;
  minLength: number;
  maxLength: number;
}

const hasUnsafeCharacters = (value: string): boolean => {
  const unsafeCharsRegex = /[<>&\/^\\?]/;
  return unsafeCharsRegex.test(value);
};

export const validateString = ({
  value,
  valueName,
  minLength,
  maxLength,
}: ValidateStringParams): string[] => {
  const errors: string[] = [];

  if (typeof value !== "string") {
    errors.push(`${valueName} must be a string`);
  }

  if (value.length < minLength) {
    errors.push(`${valueName} must be at least ${minLength} characters long`);
  }

  if (value.length > maxLength) {
    errors.push(`${valueName} must be at most ${maxLength} characters long`);
  }

  if (hasUnsafeCharacters(value)) {
    errors.push(
      `${valueName} must not contain unsafe ('<', '>', '&', '/', '\', '?') characters`
    );
  }

  return errors;
};

export const getDecimalPlacesCount = (value: number): number => {
  const [, decimalPlaces] = value.toString().split(".");
  return decimalPlaces?.length || 0;
};
