# Habit Tracker API

A self-hosted REST API for tracking habits and streaks. You run it on your own machine or server, so your data stays in your own database rather than someone else's.

This is the backend. A native iOS client lives in [Habit-tracker-swiftApp](https://github.com/MoloDani/Habit-tracker-swiftApp).

## Features

- **Account system** with email/password signup, hashed passwords, and refresh-token sessions
- **Habits** with a name, colour, icon, goal type, target, and optional reminder time
- **Multiple completions per day** — a habit can require being done once or several times daily
- **Streak calculation** across daily, weekly, and monthly goal types
- **Soft delete** — habits move between `active`, `paused`, and `deleted` states rather than vanishing, so history survives
- **Health endpoints** for uptime checks and database connectivity

## API

### Auth — `/auth`

| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/signup` | Create an account |
| `POST` | `/auth/login` | Exchange credentials for an access token |
| `POST` | `/auth/refresh` | Get a new access token from a refresh token |
| `POST` | `/auth/logout` | Revoke the current session |

### Habits — `/habits`

All habit routes require an `Authorization: Bearer <token>` header.

| Method | Route | Description |
|---|---|---|
| `POST` | `/habits` | Create a habit |
| `GET` | `/habits` | List your habits |
| `POST` | `/habits/:id` | Update a habit |
| `DELETE` | `/habits/:id` | Delete a habit |
| `POST` | `/habits/:habitId/actions` | Log a completion |
| `GET` | `/habits/:habitId/actions` | List completions |
| `DELETE` | `/habits/:habitId/actions/:actionId` | Remove a logged completion |
| `GET` | `/habits/:habitId/streak` | Current streak for a habit |

### Health

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Server is up |
| `GET` | `/health/db` | Database is reachable |

## How streaks work

A streak isn't just "did you do it yesterday" — it depends on the habit's goal type, so the logic walks backwards from today to the start of the current period (day, week, or month) and counts only the days where the habit hit its full `completions_per_day` target. A habit needing three completions a day doesn't extend its streak on a day you only did it twice.

Weeks and months are anchored to calendar boundaries in UTC rather than rolling windows, so a "weekly" habit resets on the same day for everyone regardless of when the streak began.

## Data model

Four tables, all keyed by UUID:

- **users** — email, verification flag, password hash
- **habits** — belongs to a user; carries goal configuration and display settings
- **actions** — one row per completion, with an optional numeric `value` for measurable habits
- **sessions** — refresh tokens stored as hashes, with device name, expiry, and revocation timestamp

Foreign keys cascade on delete, so removing an account removes everything attached to it. Sessions store only a hash of each token — a database leak doesn't hand over usable credentials.

## Tech stack

- **Express 5** — HTTP layer
- **MySQL** (`mysql2`) — data store
- **bcrypt** — password hashing
- **jsonwebtoken** — access tokens
- **express-validator** — request validation
- **dotenv** — configuration
- **nodemon** — development reloading

## Getting started

### Requirements

- Node.js 18+
- MySQL 8+ (the schema uses `UUID()` column defaults)

### Install

```bash
git clone https://github.com/MoloDani/Habit-traker.git
cd Habit-traker
npm install
```

### Configure

```bash
cp .env.example .env
```

Then fill it in:

```bash
PORT=3000
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=habit_tracker
JWT_SECRET=a_long_random_string
```

### Create the database

```bash
mysql -u your_user -p -e "CREATE DATABASE habit_tracker;"
mysql -u your_user -p habit_tracker < migrations/001_init.sql
```

### Run

```bash
npm run dev    # with reloading
npm start      # production
```

Confirm it's alive:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/db
```

## Project structure

```
server.js              entry point
migrations/            SQL schema
src/
  app.js               express setup and route mounting
  config/db.js         database connection
  middleware/auth.js   JWT verification
  routes/              auth, habits, actions, streak
  utils/               streak and completion calculations
```

## Roadmap

- [ ] Email verification (the `email_verified` column exists but isn't yet used)
- [ ] Reminder delivery — `reminder_time` is stored but nothing acts on it
- [ ] Habit statistics and history endpoints
- [ ] Rate limiting on auth routes
- [ ] Automated tests
- [ ] Dockerfile for one-command self-hosting
