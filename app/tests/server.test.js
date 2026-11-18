const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../src/server");

test("Health API returns OK", async () => {
    const server = http.createServer(app);

    await new Promise((resolve) => {
        server.listen(0, "127.0.0.1", resolve);
    });

    try {
        const port = server.address().port;

        const response = await new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:${port}/health`, (res) => {
                let data = "";

                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {
                    resolve({
                        status: res.statusCode,
                        body: JSON.parse(data)
                    });
                });

                res.on("error", reject);
            }).on("error", reject);
        });

        assert.equal(response.status, 200);
        assert.equal(response.body.status, "OK");
        assert.equal(response.body.message, "Server is running");

    } finally {
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
});
