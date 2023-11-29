const express = require("express");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const users = [];

function verify(request, response, next) {
    const { username } = request.headers;
    const user = users.find((user) => user.username === username);

    if (!user) {
        return response.status(404).json({ error: "username not found" });
    }

    request.user = user;

    return next();
}

function checksCreateTodosUserAvailability(request, response, next) {
    const { user } = request;

    if (!user.pro) {
        if (user.todo.length >= 10) {
            return response.status(403).json({ error: "user is not avaible" });
        }
    }

    return next();
}

function checksTodoExists(request, response, next) {
    const { user } = request;
    const { id } = request.params;

    user.todo.forEach((todo) => {
        if (todo.id === id) {
            request.todo = todo;
        }
    });

    return request.todo
        ? next()
        : response.status(404).json({ error: "todo is not found" });
}

app.post("/users", (request, response) => {
    const { name, username } = request.body;

    const user = {
        id: uuidv4(),
        name,
        username,
        todo: [],
        pro: false,
    };

    const exist = users.find((use) => use.username === user.username);

    if (exist) {
        return response.status(400).json({ error: "username already exists" });
    }

    users.push(user);
    return response.status(201).json(user);
});

app.use(verify);

app.get("/todo", (request, response) => {
    const { user } = request;

    return response.json(user.todo);
});

app.post("/todo", checksCreateTodosUserAvailability, (request, response) => {
    const { user } = request;
    const { title, deadline } = request.body;

    const todo = {
        id: uuidv4(),
        title,
        done: false,
        deadline: new Date(deadline),
        created_at: new Date(),
    };

    user.todo.push(todo);

    return response.status(201).json(todo);
});

app.put("/todo/:id", checksTodoExists, (request, response) => {
    const { todo } = request;
    const { title, deadline } = request.body;

    todo.title = title;
    todo.deadline = new Date(deadline);
    return response.status(200).json(todo);
});

app.patch("/todo/:id/done", checksTodoExists, (request, response) => {
    const { todo } = request;

    todo.done = true;
    return response.status(200).json(todo);
});

app.delete("/todo/:id", checksTodoExists, (request, response) => {
    const { todo, user } = request;
    const index = user.todo.findIndex((todos) => todos === todo);

    user.todo.splice(index, 1);
    return response.status(204).send();
});

app.listen(3333);
