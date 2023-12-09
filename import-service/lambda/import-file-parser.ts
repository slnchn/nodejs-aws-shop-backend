import { S3Event } from "aws-lambda";

import {
  getFileStream,
  moveFileToParsed,
  sendToSQS,
} from "./services/import-file-parser-service";
import { buildResponseFromObject } from "./utils/server-utils";

export const importFileParser = async (event: S3Event) => {
  try {
    const stream = await getFileStream(event);
    if (!stream) {
      return buildResponseFromObject(500, {
        message: "Error of getting file stream",
      });
    }

    await sendToSQS(stream);

    // if file was parsed + logged successfully, we can move it to the parsed/
    await moveFileToParsed(event);

    return buildResponseFromObject(200, { message: "OK, please check logs" });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }

    return buildResponseFromObject(500, { message: "Internal server error" });
  }
};
