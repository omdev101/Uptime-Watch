# Uptime Watch API

A robust, real-time API monitoring service built with Ruby on Rails and PostgreSQL. It tracks endpoint health, uptime, and latency via asynchronous background workers.

## Tech Stack
- **Framework:** Ruby on Rails (API Mode)
- **Database:** PostgreSQL
- **Background Jobs:** Solid Queue
- **Concurrency:** Concurrent HTTP requests via background workers

## Features
- **Real-time Monitoring:** Tracks HTTP status codes and response latency (in milliseconds).
- **Asynchronous Pings:** Background jobs automatically ping registered endpoints at configurable intervals.
- **Environment Tagging:** Organizes endpoints by environment (Production, Staging, Development).
- **Custom Headers:** Supports custom JSON headers for pinging authenticated or protected routes.

## Prerequisites
- Ruby 3.x+
- PostgreSQL
- Redis (optional, depending on Solid Queue configuration)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd monitor_api
   ```

2. **Install dependencies:**
   ```bash
   bundle install
   ```

3. **Database setup:**
   Ensure PostgreSQL is running, then initialize the database and run migrations:
   ```bash
   rails db:setup
   rails db:migrate
   ```

4. **Start the server and background workers:**
   ```bash
   # Starts the Puma server on port 3000
   rails server
   ```
   *(Note: Ensure your Solid Queue workers are running to process endpoint health checks.)*

## Environment Variables

To run the application securely, you may need to configure the following environment variables (or place them in a `.env` file):

- `DATABASE_URL` (PostgreSQL connection string)
- `RAILS_MASTER_KEY` (For decrypting credentials)

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
