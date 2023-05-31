const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");
app.use(express.json());

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Successfully running the Server");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbServer();

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
      requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
  };

  const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
  };

  const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
  };

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const dbQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId}
    `;
  const dbResponse = await db.get(dbQuery);
  response.send(dbResponse);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const updateQuery = `
    INSERT INTO
        todo(id, todo, priority, status)
    VALUES
        (
            ${id},
            "${todo}",
            "${priority}",
            "${status}"
        )
  `;
  await db.run(updateQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }
  const previousTodoQuery = `
    SELECT 
        *
    FROM 
        todo
    WHERE
        id = ${todoId}
    `;
  const previousTodoResponse = await db.get(previousTodoQuery);
  const {
    todo = previousTodoResponse.todo,
    status = previousTodoResponse.status,
    priority = previousTodoResponse.priority,
  } = request.body;
  const updateTodoQuery = `
    UPDATE 
        todo
    SET
        todo = "${todo}",
        priority = "${priority}",
        status = "${status}"
    WHERE id = ${todoId}
    `;
  await db.run(updateTodoQuery);
  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const dbDeleteQuery = `
    DELETE FROM
        todo
    WHERE id = ${todoId}
    `;
  await db.run(dbDeleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
