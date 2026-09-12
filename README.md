# Mini Service Ticket Management System

A full stack web application for managing customer support tickets. Staff can create, view, filter, search, and update tickets, and add comments to track progress.

## Tech Stack

- **Frontend:** React (Create React App)
- **Backend:** Node.js with Express
- **Database:** SQLite (via the `sqlite3` npm package)

## Project Structure

Himanvitha-T-N-ticket-service-system/
client/ React frontend
server/ Node.js/Express backend
README.md


## Setup Instructions

### 1. Install dependencies

Backend:
```bash
cd server
npm install
```

Frontend (in a separate terminal):
```bash
cd client
npm install
```

### 2. Seed the database (required before first run)

The database schema is not created automatically when the server starts. Run this once from the `server` folder to create the tables and insert 8 sample tickets:

```bash
cd server
npm run seed
```

If you skip this step, API requests will fail with a 500 error since the database tables won't exist yet.

### 3. Start the backend

```bash
cd server
npm start
```
Runs on **http://localhost:5000**

### 4. Start the frontend

In a separate terminal:
```bash
cd client
npm start
```
Runs on **http://localhost:3000** and opens automatically in your browser.

## Running Tests

Backend tests are in `server/tests/ticketCrud.test.js`. Run them with:
```bash
cd server
node tests/ticketCrud.test.js
```
This spins up a temporary test server on port 5002, runs through ticket CRUD, filtering, pagination, sorting, and comment endpoints, and prints pass/fail results.

## API Endpoints

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets` | List tickets. Supports query params: `status`, `priority`, `customer`, `search`, `page`, `limit`, `sortBy` |
| GET | `/api/tickets/:id` | Get a single ticket by id |
| POST | `/api/tickets` | Create a ticket |
| PUT | `/api/tickets/:id` | Update a ticket (status, priority, or any field) |
| DELETE | `/api/tickets/:id` | Delete a ticket |

**Example: create a ticket**

Request:
```json
POST /api/tickets
{
  "customerName": "Acme Corp",
  "title": "Login page not loading",
  "description": "Users report a blank screen after entering credentials.",
  "priority": "High"
}
```

Response (201 Created):
```json
{
  "id": 9,
  "customerName": "Acme Corp",
  "title": "Login page not loading",
  "description": "Users report a blank screen after entering credentials.",
  "priority": "High",
  "status": "Open",
  "createdAt": "2026-09-12 10:15:00",
  "updatedAt": "2026-09-12 10:15:00"
}
```

**Example: list tickets with filters**

Request:

GET /api/tickets?status=Open&priority=High&page=1&limit=10


Response (200 OK):
```json
{
  "tickets": [ /* array of ticket objects */ ],
  "totalCount": 15,
  "totalPages": 2
}
```

**Error response format** (used consistently across all endpoints):
```json
{ "error": "customerName is required" }
```

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/:id/comments` | Add a comment to a ticket |
| GET | `/api/tickets/:id/comments` | Get all comments for a ticket, oldest first |

**Example: add a comment**

Request:
```json
POST /api/tickets/1/comments
{ "text": "Called the customer, awaiting response" }
```

Response (201 Created):
```json
{
  "id": 3,
  "ticketId": 1,
  "text": "Called the customer, awaiting response",
  "createdAt": "2026-09-12 02:39:21"
}
```

## Validation Rules

- `customerName`, `title`, `description`, and `priority` are required to create a ticket
- `priority` must be exactly `Low`, `Medium`, or `High`
- `status` (when updating) must be exactly `Open`, `In Progress`, `Resolved`, or `Closed`
- Comment `text` is required and cannot be blank

## Features

- Full CRUD for tickets
- Filter by status, priority, customer name
- Search by title or customer name
- Sort by created date or priority
- Pagination
- Comments on tickets
- Status changes update the `updatedAt` timestamp automatically
- Loading and error states on every network request
- Responsive layout, usable on mobile screens
- Timestamps stored in UTC on the backend, converted to the viewer's local timezone in the frontend

## Assumptions

- No authentication or login system. Any user with access to the app can view and manage all tickets.
- Single shared database, no multi-tenant separation between different companies or teams.
- No environment variables are required to run the project.