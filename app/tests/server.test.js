
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");

const app = require("../src/server");

async function request(method, path, body) {
  const server = http.createServer(app);

  await new Promise(resolve => {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const port = server.address().port;

    return await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: body === undefined ? {} : {
          "Content-Type": "application/json"
        }
      }, res => {
        let data = "";

        res.on("data", chunk => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode,
              body: JSON.parse(data)
            });
          } catch (err) {
            reject(err);
          }
        });

        res.on("error", reject);
      });

      req.on("error", reject);

      if (body !== undefined) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// TEST 1: Health Check
test("Health API returns OK", async () => {
  const res = await request("GET", "/health");

  assert.equal(res.status, 200);
  assert.equal(res.body.status, "OK");
  assert.equal(res.body.message, "Server is running");
});

// TEST 2: Get task list
test("GET /api/tasks returns an array", async () => {
  const res = await request("GET", "/api/tasks");

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

// TEST 3: Create task
test("POST /api/tasks creates a task", async () => {
  const res = await request("POST", "/api/tasks", {
    title: "Test DevOps"
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.title, "Test DevOps");
  assert.equal(res.body.completed, false);
});

// TEST 4: Reject empty title
test("POST /api/tasks rejects empty title", async () => {
  const res = await request("POST", "/api/tasks", {
    title: ""
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Task title is required");
});

// TEST 5: Complete task
test("PATCH /api/tasks/:id/complete completes task", async () => {
  const created = await request("POST", "/api/tasks", {
    title: "Complete Test"
  });

  assert.equal(created.status, 201);

  const id = created.body.id;

  const res = await request(
    "PATCH",
    `/api/tasks/${id}/complete`
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.completed, true);
});

// TEST 6: Delete task
test("DELETE /api/tasks/:id deletes task", async () => {
  const created = await request("POST", "/api/tasks", {
    title: "Delete Test"
  });

  assert.equal(created.status, 201);

  const id = created.body.id;

  const res = await request(
    "DELETE",
    `/api/tasks/${id}`
  );

  assert.equal(res.status, 200);
  assert.equal(res.body.message, "Task deleted");
});

// TEST 7: Complete nonexistent task
test("PATCH returns 404 for missing task", async () => {
  const res = await request(
    "PATCH",
    "/api/tasks/999999/complete"
  );

  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Task not found");
});

// TEST 8: Delete nonexistent task
test("DELETE returns 404 for missing task", async () => {
  const res = await request(
    "DELETE",
    "/api/tasks/999999"
  );

  assert.equal(res.status, 404);
  assert.equal(res.body.error, "Task not found");
});
