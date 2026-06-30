# Uptime Watch Dashboard

A sleek, modern dashboard for tracking API and endpoint health in real-time. Built with React, Vite, and Tailwind CSS, this frontend consumes the Uptime Watch API to provide analytics, status checks, and latency visualizations.

## Tech Stack
- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS

## Features
- **Real-time Telemetry:** Visualizes endpoint latency through dynamic sparkline charts.
- **Global Uptime Metrics:** Calculates overall uptime percentage and average system latency across all monitored nodes.
- **Status Filtering:** Quickly filter targets by Environment (Production, Staging, Development) or Operational Status (Outage, Operational).
- **Command Palette:** Built-in fast search using `⌘K` to quickly navigate large lists of endpoints.
- **Dark Mode Support:** First-class dark mode integration matching system preferences.

## Prerequisites
- Node.js (v16 or higher recommended)
- npm (or yarn / pnpm)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd monitor_web
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and specify the URL of your backend API:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Building for Production

To create a production build of the dashboard, run:
```bash
npm run build
```
This will compile the application into the `dist` folder, which can be deployed to static hosting services like Render, Vercel, or Netlify.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
