# Conference Room Booking System

## Problem Statement

Conference room booking in organizations is often chaotic, leading to several common issues:

1. **Double Bookings**: Multiple teams booking the same room at the same time
2. **Inefficient Utilization**: Rooms sitting empty despite being marked as "booked"
3. **Lack of Visibility**: No easy way to check room availability
4. **Manual Processes**: Paper sign-ups or shared spreadsheets that are hard to maintain
5. **No Accountability**: No record of who booked what and when

This problem causes productivity loss, meeting disruptions, and workplace friction.

## Solution

Our Conference Room Booking System provides a simple, web-based interface that:

1. Shows all available conference rooms with their features and capacity
2. Displays real-time availability of rooms
3. Allows users to book rooms for specific dates and time slots
4. Provides a way to view and manage your bookings
5. Prevents double bookings by marking reserved slots as unavailable

## System Architecture

The system uses a client-server architecture with:

1. **Frontend**: Hosted on Cloudflare Pages
   - HTML/CSS/JavaScript for the user interface
   - Responsive design that works on desktop and mobile devices

2. **Backend API**: Cloudflare Worker
   - RESTful API endpoints for managing rooms and bookings
   - In-memory data storage (would use Cloudflare D1 in a production version)
   - Cross-Origin Resource Sharing (CORS) support

### API Endpoints

- `GET /rooms` - Get list of all rooms with availability for a specific date
- `GET /rooms/:id` - Get details of a specific room with availability
- `GET /bookings` - Get list of bookings for a specific email
- `POST /bookings` - Create a new booking
- `DELETE /bookings/:id` - Cancel a booking

### Data Models

**Room**
```json
{
  "id": "1",
  "name": "Executive Room",
  "capacity": 10,
  "features": ["Projector", "Whiteboard", "Video conferencing"]
}
```

**Booking**
```json
{
  "id": "abc123",
  "roomId": "1",
  "date": "2025-05-10",
  "time": "14:00",
  "email": "user@example.com",
  "title": "Project Planning",
  "attendees": 6,
  "createdAt": "2025-05-03T12:34:56Z"
}
```

## How It Works

1. **Viewing Rooms**:
   - User selects a date
   - System displays all available rooms
   - User can view room details (capacity, features)

2. **Booking a Room**:
   - User clicks on a room to check availability
   - System shows available time slots
   - User selects a time slot and enters booking details
   - System creates the booking and marks that time slot as unavailable

3. **Managing Bookings**:
   - User enters their email
   - System displays all their bookings
   - User can cancel any booking they've made

## Technical Implementation

### Frontend

- Built with vanilla JavaScript, HTML, and CSS for simplicity and performance
- Responsive design using CSS Grid and Flexbox
- Tabs for switching between available rooms and bookings
- Modal dialog for creating bookings
- Form validation to ensure all required fields are filled

### Backend

- RESTful API implemented as a Cloudflare Worker
- In-memory data storage (simulated database)
- CORS support for cross-origin requests
- JSON for data interchange

## Deployment

### Cloudflare Pages (Frontend)

1. Create a repository with the frontend code
2. Connect the repository to Cloudflare Pages
3. Configure build settings (none required for static HTML)
4. Deploy the site

### Cloudflare Worker (API)

1. Install Wrangler CLI tool: `npm install -g wrangler`
2. Login to Cloudflare: `wrangler login`
3. Create a new worker: `wrangler init conference-booking-api`
4. Replace the worker code with our implementation
5. Deploy the worker: `wrangler deploy`

## Future Enhancements

With additional time and resources, we would add:

1. **Persistent Storage**: Using Cloudflare D1 for storing rooms and bookings
2. **Authentication**: User accounts for better security and tracking
3. **Recurring Bookings**: Ability to book rooms on a recurring basis
4. **Notifications**: Email reminders for upcoming bookings
5. **Admin Panel**: For managing rooms, viewing all bookings, and generating reports
6. **Room Resources**: Ability to book additional resources like projectors, catering, etc.
7. **Calendar Integration**: Sync with popular calendar applications
