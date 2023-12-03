import { S3Event } from "aws-lambda";

import { importFileParser } from "../../lambda/import-file-parser";
import {
  getFileStream,
  logFileStream,
  moveFileToParsed,
} from "../../lambda/services/import-file-parser-service";

jest.mock("../../lambda/services/import-file-parser-service");

describe("importFileParser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle successful case", async () => {
    const mockEvent = {} as S3Event;
    const mockStream = {};

    (getFileStream as jest.Mock).mockResolvedValue(mockStream);
    (logFileStream as jest.Mock).mockResolvedValue(undefined);
    (moveFileToParsed as jest.Mock).mockResolvedValue(undefined);

    const result = await importFileParser(mockEvent);

    expect(getFileStream).toHaveBeenCalledWith(mockEvent);
    expect(logFileStream).toHaveBeenCalledWith(mockStream);
    expect(moveFileToParsed).toHaveBeenCalledWith(mockEvent);
    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body).message).toEqual("OK, please check logs");
  });

  it("should handle getFileStream failure", async () => {
    const mockEvent = {} as S3Event;

    (getFileStream as jest.Mock).mockResolvedValue(null);

    const result = await importFileParser(mockEvent);

    expect(getFileStream).toHaveBeenCalledWith(mockEvent);
    expect(result.statusCode).toEqual(500);
    expect(JSON.parse(result.body).message).toEqual(
      "Error of getting file stream"
    );
  });

  it("should handle logFileStream failure", async () => {
    const mockEvent = {} as S3Event;
    const mockStream = {};
    const mockError = new Error("Error");

    (getFileStream as jest.Mock).mockResolvedValue(mockStream);
    (logFileStream as jest.Mock).mockRejectedValue(mockError);

    const result = await importFileParser(mockEvent);

    expect(getFileStream).toHaveBeenCalledWith(mockEvent);
    expect(logFileStream).toHaveBeenCalledWith(mockStream);
    expect(result.statusCode).toEqual(500);
    expect(JSON.parse(result.body).message).toEqual("Internal server error");
  });

  it("should handle moveFileToParsed failure", async () => {
    const mockEvent = {} as S3Event;
    const mockStream = {};
    const mockError = new Error("Error");

    (getFileStream as jest.Mock).mockResolvedValue(mockStream);
    (logFileStream as jest.Mock).mockResolvedValue(undefined);
    (moveFileToParsed as jest.Mock).mockRejectedValue(mockError);

    const result = await importFileParser(mockEvent);

    expect(getFileStream).toHaveBeenCalledWith(mockEvent);
    expect(logFileStream).toHaveBeenCalledWith(mockStream);
    expect(moveFileToParsed).toHaveBeenCalledWith(mockEvent);
    expect(result.statusCode).toEqual(500);
    expect(JSON.parse(result.body).message).toEqual("Internal server error");
  });
});
