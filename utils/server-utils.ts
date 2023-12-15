// TODO: share this file with other services

export const buildResponse = (statusCode: number, body: string) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": "*",
    },
    body,
  };
};

export const buildResponseFromObject = (statusCode: number, body: object) =>
  buildResponse(statusCode, JSON.stringify(body));

export const getValidBody = (body: string): object | null => {
  try {
    const result = JSON.parse(body); // throws an error if has wrong format
    if (
      typeof result === "object" &&
      result !== null &&
      !Array.isArray(result)
    ) {
      return result;
    }

    return null;
  } catch (error) {
    return null;
  }
};
