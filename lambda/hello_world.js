
exports.helloWorld = async function (event, context) {
    try {
        var method = event.httpMethod;

        if (method === "GET") {
            if (event.path === "/api/") {
                return {
                    statusCode: 200,
                    headers: {},
                    body: JSON.stringify("Hello World")
                };
            }
        }

        // We only accept GET for now
        return {
            statusCode: 400,
            headers: {},
            body: JSON.stringify("We only accept GET /api/ - got " + method + " " + event.path)
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
