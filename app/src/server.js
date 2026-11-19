const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("src/public"));

let tasks = [];
let nextId = 1;

// Trang chủ

// Health check
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Server is running"
    });
});

// Xem danh sách công việc
app.get("/api/tasks", (req, res) => {
    res.json(tasks);
});

// Thêm công việc
app.post("/api/tasks", (req, res) => {
    const title = req.body?.title;

    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
            error: "Task title is required"
        });
    }

    const task = {
        id: nextId++,
        title: title.trim(),
        completed: false
    };

    tasks.push(task);
    res.status(201).json(task);
});

// Hoàn thành công việc
app.patch("/api/tasks/:id/complete", (req, res) => {
    const task = tasks.find(
        t => t.id === Number(req.params.id)
    );

    if (!task) {
        return res.status(404).json({
            error: "Task not found"
        });
    }

    task.completed = true;
    res.json(task);
});

// Xóa công việc
app.delete("/api/tasks/:id", (req, res) => {
    const index = tasks.findIndex(
        t => t.id === Number(req.params.id)
    );

    if (index === -1) {
        return res.status(404).json({
            error: "Task not found"
        });
    }

    tasks.splice(index, 1);
    res.json({ message: "Task deleted" });
});

if (require.main === module) {
    app.listen(8000, "0.0.0.0", () => {
        console.log("Server running on port 8000");
    });
}

module.exports = app;
