
exports.main = async function (event, context) {
    try {
        var method = event.httpMethod;

        if (method === "GET") {
            if (event.path === "/") {
                return {
                    statusCode: 200,
                    headers: {},
                    body: "Hello World"
                };
            }
        }

        // We only accept GET for now
        return {
            statusCode: 400,
            headers: {},
            body: "We only accept GET /"
        };
    } catch (error) {
        var body = error.stack || JSON.stringify(error, null, 2);
        return {
            statusCode: 400,
            headers: {},
            body: JSON.stringify(body)
        }
    }
}