# Project 068 – Todo App with Actix-Web + PostgreSQL (Full CRUD)

## Code
Implements a complete backend API server using `actix-web` and `sqlx`, performing async SQL queries on a PostgreSQL database, converting database constraints into REST error replies, and exposing endpoints for CRUD actions.

---

## Problem
Web applications require persistent, transactional data storage backend services that handle multiple parallel HTTP requests, manage pools of connections, and handle errors robustly.

---

## Goal
Build a CRUD REST API backing a Todo table in PostgreSQL, supporting GET/POST/PUT/DELETE commands, input validations, database health checks, and JSON response models.

---

## What I Learn
- Spawning asynchronous web servers using the `actix-web` HTTP library
- Managing persistent database connection pools using the `PgPool` object from SQLx
- Mapping SQL query result rows directly to custom structs using `FromRow` macro derivations
- Handling SQL constraint violations and mapping them into custom Web Response errors
- Intercepting and responding to path variables (such as `/todos/{id}`) using `web::Path` extractors
- Reading JSON request payloads using `web::Json` parameter types
- Initializing database schemas programmatically via SQL schema creation queries during startup
- Loading local settings from `.env` files using `dotenvy`

---

## Notes

### Setup Instructions

#### Step 1: Set Up PostgreSQL Database
Start PostgreSQL using the method appropriate for your operating system:
```bash
# On macOS with Homebrew:
brew services start postgresql

# On Ubuntu:
sudo service postgresql start
```

Access the PostgreSQL command line console:
```bash
psql postgres
# or
psql -U $(whoami) postgres
# or
sudo -u postgres psql
```

Once in `psql`, execute the SQL commands below to create the database and table:
```sql
-- Create database
CREATE DATABASE todo_db;

-- Connect to the database
\c todo_db;

-- Create the todos table
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- Exit psql
\q
```

#### Step 2: Create Environment File
Create a `.env` file in the root of the project:
```bash
touch .env
```
Edit the file to include your database connection URL (replacing username and password with your actual PostgreSQL credentials):
```text
DATABASE_URL=postgres://username:password@localhost/todo_db
```

#### Step 3: Run and Test
```bash
# Build project
cargo build

# Run project
cargo run
```

Test the API endpoints from a separate terminal:
```bash
# Health check
curl http://localhost:8080/health

# Add a todo item
curl -X POST -H "Content-Type: application/json" \
-d '{"title": "Learn Actix Web with PostgreSQL"}' http://localhost:8080/todos

# Get all todos
curl http://localhost:8080/todos

# Update a todo item
curl -X PUT -H "Content-Type: application/json" \
-d '{"completed": true}' http://localhost:8080/todos/1

# Delete a todo item
curl -X DELETE http://localhost:8080/todos/1
```