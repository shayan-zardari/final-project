# Conference Room Booking System

A simple web-based application for booking conference rooms in an organization. This project uses Cloudflare Pages for the frontend and Cloudflare Workers for the backend API.

## Project Structure

```
conference-booking/
├── site/                  # Frontend code
│   └── index.html         # HTML, CSS, and JavaScript
├── worker/                # Backend code
│   ├── index.js           # Worker API code
│   └── wrangler.toml      # Worker configuration
└── README.md              # This file
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare account

## Local Development

### Setting Up the Frontend

1. No build step is required for the frontend as it's a single HTML file with inline CSS and JavaScript
2. You can serve it locally using any static file server:

```bash
# Using Node.js http-server (install if you don't have it)
npm install -g http-server
cd site
http-server
```

This will start a local server, typically at http://localhost:8080

### Setting Up the Backend

1. Install Wrangler CLI:

```bash
npm install -g wrangler
```

2. Login to your Cloudflare account:

```bash
wrangler login
```

3. Navigate to the worker directory:

```bash
cd worker
```

4. Start the worker locally:

```bash
wrangler dev
```

This will start the worker locally, typically at http://localhost:8787

### Connecting Frontend to Local Backend

When running locally, you'll need to update the API_URL in the frontend:

1. Open `site/index.html`
2. Find the line: `const API_URL = 'https://conference-booking-api.YOUR_WORKER_SUBDOMAIN.workers.dev';`
3. Change it to: `const API_URL = 'http://localhost:8787';`

## Deployment

### Deploying the Worker (API)

1. In the worker directory, edit `wrangler.toml`:
   - Update the `routes` pattern with your Cloudflare account subdomain

2. Deploy the worker:

```bash
cd worker
wrangler deploy
```

Note the URL of your deployed worker (something like `https://conference-booking-api.YOUR_WORKER_SUBDOMAIN.workers.dev`)

### Deploying the Frontend

1. Before deploying, update the API_URL in `site/index.html`:
   - Find the line: `const API_URL = 'https://conference-booking-api.YOUR_WORKER_SUBDOMAIN.workers.dev';`
   - Replace `YOUR_WORKER_SUBDOMAIN` with your actual Cloudflare subdomain

2. Deploy to Cloudflare Pages:
   - Create a new GitHub repo with your project files
   - Go to Cloudflare Dashboard > Pages > Create a project
   - Connect your GitHub repository
   - Configure the build settings:
     - Build command: (leave empty)
     - Build output directory: `site`
   - Deploy the site

## Usage

1. Open the deployed frontend application
2. Select a date to view available rooms
3. Click on a room to check time slot availability
4. Select a time slot and fill in the booking details
5. To view your bookings, go to the "My Bookings" tab and enter your email
6. You can cancel your bookings from the "My Bookings" tab

## API Endpoints

- `GET /rooms?date=YYYY-MM-DD` - Get available rooms for a date
- `GET /rooms/:id?date=YYYY-MM-DD` - Get room details with availability for a date
- `GET /bookings?email=user@example.com` - Get bookings for an email
- `POST /bookings` - Create a new booking
- `DELETE /bookings/:id` - Cancel a booking

## Data Persistence

This demo uses in-memory storage in the Worker, so data will be reset when the Worker is redeployed or restarted. For production use, integrate with Cloudflare D1 or another database.

## License

MIT
