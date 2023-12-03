import { APIGatewayProxyEvent } from "aws-lambda";

type ValidationResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

export const validateImportProductsFile = (
  event: APIGatewayProxyEvent
): ValidationResult => {
  if (!event?.queryStringParameters?.name) {
    return {
      success: false,
      message: "Please provide name",
    };
  }

  if (!event.queryStringParameters.name.match(/\.csv$/i)) {
    return {
      success: false,
      message: "File must be csv",
    };
  }

  return {
    success: true,
  };
};
