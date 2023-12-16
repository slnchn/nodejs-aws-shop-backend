"use strict";
// TODO: share this file with other services
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidBody = exports.buildResponseFromObject = exports.buildResponse = void 0;
const buildResponse = (statusCode, body) => {
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
exports.buildResponse = buildResponse;
const buildResponseFromObject = (statusCode, body) => (0, exports.buildResponse)(statusCode, JSON.stringify(body));
exports.buildResponseFromObject = buildResponseFromObject;
const getValidBody = (body) => {
    try {
        const result = JSON.parse(body); // throws an error if has wrong format
        if (typeof result === "object" &&
            result !== null &&
            !Array.isArray(result)) {
            return result;
        }
        return null;
    }
    catch (error) {
        return null;
    }
};
exports.getValidBody = getValidBody;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VydmVyLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw0Q0FBNEM7OztBQUVyQyxNQUFNLGFBQWEsR0FBRyxDQUFDLFVBQWtCLEVBQUUsSUFBWSxFQUFFLEVBQUU7SUFDaEUsT0FBTztRQUNMLFVBQVU7UUFDVixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsWUFBWTtZQUM1Qiw2QkFBNkIsRUFBRSxHQUFHO1lBQ2xDLGtDQUFrQyxFQUFFLElBQUk7WUFDeEMsOEJBQThCLEVBQUUsR0FBRztTQUNwQztRQUNELElBQUk7S0FDTCxDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBWFcsUUFBQSxhQUFhLGlCQVd4QjtBQUVLLE1BQU0sdUJBQXVCLEdBQUcsQ0FBQyxVQUFrQixFQUFFLElBQVksRUFBRSxFQUFFLENBQzFFLElBQUEscUJBQWEsRUFBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBRHJDLFFBQUEsdUJBQXVCLDJCQUNjO0FBRTNDLE1BQU0sWUFBWSxHQUFHLENBQUMsSUFBWSxFQUFpQixFQUFFO0lBQzFELElBQUk7UUFDRixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsc0NBQXNDO1FBQ3ZFLElBQ0UsT0FBTyxNQUFNLEtBQUssUUFBUTtZQUMxQixNQUFNLEtBQUssSUFBSTtZQUNmLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFDdEI7WUFDQSxPQUFPLE1BQU0sQ0FBQztTQUNmO1FBRUQsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxJQUFJLENBQUM7S0FDYjtBQUNILENBQUMsQ0FBQztBQWZXLFFBQUEsWUFBWSxnQkFldkIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPOiBzaGFyZSB0aGlzIGZpbGUgd2l0aCBvdGhlciBzZXJ2aWNlc1xuXG5leHBvcnQgY29uc3QgYnVpbGRSZXNwb25zZSA9IChzdGF0dXNDb2RlOiBudW1iZXIsIGJvZHk6IHN0cmluZykgPT4ge1xuICByZXR1cm4ge1xuICAgIHN0YXR1c0NvZGUsXG4gICAgaGVhZGVyczoge1xuICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L3BsYWluXCIsXG4gICAgICBcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiOiBcIipcIixcbiAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHNcIjogdHJ1ZSxcbiAgICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiOiBcIipcIixcbiAgICB9LFxuICAgIGJvZHksXG4gIH07XG59O1xuXG5leHBvcnQgY29uc3QgYnVpbGRSZXNwb25zZUZyb21PYmplY3QgPSAoc3RhdHVzQ29kZTogbnVtYmVyLCBib2R5OiBvYmplY3QpID0+XG4gIGJ1aWxkUmVzcG9uc2Uoc3RhdHVzQ29kZSwgSlNPTi5zdHJpbmdpZnkoYm9keSkpO1xuXG5leHBvcnQgY29uc3QgZ2V0VmFsaWRCb2R5ID0gKGJvZHk6IHN0cmluZyk6IG9iamVjdCB8IG51bGwgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3VsdCA9IEpTT04ucGFyc2UoYm9keSk7IC8vIHRocm93cyBhbiBlcnJvciBpZiBoYXMgd3JvbmcgZm9ybWF0XG4gICAgaWYgKFxuICAgICAgdHlwZW9mIHJlc3VsdCA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgcmVzdWx0ICE9PSBudWxsICYmXG4gICAgICAhQXJyYXkuaXNBcnJheShyZXN1bHQpXG4gICAgKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59O1xuIl19