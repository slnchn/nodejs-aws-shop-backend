// TODO: share this file with other services

export const logInfo = (caller: string, message: string) => {
  console.info(`[${new Date().toISOString()}] INFO in ${caller}: ${message}`);
};

export const logError = (caller: string, message: string) => {
  console.error(`[${new Date().toISOString()}] ERROR in ${caller}: ${message}`);
};
