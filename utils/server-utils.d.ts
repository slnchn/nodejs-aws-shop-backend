export declare const buildResponse: (statusCode: number, body: string) => {
    statusCode: number;
    headers: {
        "Content-Type": string;
        "Access-Control-Allow-Origin": string;
        "Access-Control-Allow-Credentials": boolean;
        "Access-Control-Allow-Headers": string;
    };
    body: string;
};
export declare const buildResponseFromObject: (statusCode: number, body: object) => {
    statusCode: number;
    headers: {
        "Content-Type": string;
        "Access-Control-Allow-Origin": string;
        "Access-Control-Allow-Credentials": boolean;
        "Access-Control-Allow-Headers": string;
    };
    body: string;
};
export declare const getValidBody: (body: string) => object | null;
