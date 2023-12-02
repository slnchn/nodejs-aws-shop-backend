// TODO: share this file with other services

export const buildResponse = (statusCode: number, body: object) => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
      "Access-Control-Allow-Headers": "*",
    },
    body: JSON.stringify(body),
  };
};

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
