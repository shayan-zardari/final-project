// Helper function to generate random booking ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper function to handle CORS headers
function handleCors(request) {
  const origin = request.headers.get('Origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  return corsHeaders;
}

// Handle OPTIONS request for CORS preflight
async function handleOptions(request) {
  const corsHeaders = handleCors(request);
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Handle GET request to fetch all rooms
async function handleGetRooms(request, env) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  
  if (!date) {
    return new Response(JSON.stringify({ error: 'Date parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...handleCors(request) },
    });
  }
  
  // Fetch rooms from D1
  const { results } = await env.DB.prepare('SELECT id, name, capacity, features FROM rooms').all();
  
  // Parse features from JSON string
  const rooms = results.map(room => ({
    ...room,
    features: JSON.parse(room.features)
  }));
  
  return new Response(JSON.stringify(rooms), {
    headers: { 'Content-Type': 'application/json', ...handleCors(request) },
  });
}

// Handle GET request to fetch a specific room with availability
async function handleGetRoom(request, roomId, env) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  
  if (!date) {
    return new Response(JSON.stringify({ error: 'Date parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...handleCors(request) },
    });
  }
  
  // Fetch room from D1
  const room = await env.DB.prepare('SELECT id, name, capacity, features FROM rooms WHERE id = ?')
    .bind(roomId)
    .first();
  
  if (!room) {
    return new Response(JSON.stringify({ error: 'Room not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...handleCors(request) },
    });
  }
  
  // Parse features
  room.features = JSON.parse(room.features);
  
  // Fetch booked slots for this room on the specified date
  const { results: bookedSlots } = await env.DB.prepare('SELECT time FROM bookings WHERE roomId = ? AND date = ?')
    .bind(roomId, date)
    .all();
  
  const roomWithAvailability = {
    ...room,
    bookedSlots: bookedSlots.map(b => b.time)
  };
  
  return new Response(JSON.stringify(roomWithAvailability), {
    headers: { 'Content-Type': 'application/json', ...handleCors(request) },
  });
}

// Handle GET request to fetch bookings for a specific email
async function handleGetBookings(request, env) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  
  if (!email) {
    return new Response(JSON.stringify({ error: 'Email parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...handleCors(request) },
    });
  }
  
  // Fetch bookings from D1
  const { results: bookings } = await env.DB.prepare(`
    SELECT bookings.*, rooms.name AS roomName
    FROM bookings
    LEFT JOIN rooms ON bookings.roomId = rooms.id
    WHERE bookings.email = ?
  `).bind(email.toLowerCase()).all();
  
  return new Response(JSON.stringify(bookings), {
    headers: { 'Content-Type': 'application/json', ...handleCors(request) },
  });
}

// Handle POST request to create a new booking
async function handleCreateBooking(request, env) {
  try {
    const data = await request.json();
    const { roomId, date, time, email, title, attendees } = data;
    
    if (!roomId || !date || !time || !email || !title || !attendees) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...handleCors(request) },
      });
    }
    
    // Check if the room exists
    const room = await env.DB.prepare('SELECT id FROM rooms WHERE id = ?')
      .bind(roomId)
      .first();
    
    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...handleCors(request) },
      });
    }
    
    // Check if the time slot is booked
    const existingBooking = await env.DB.prepare('SELECT id FROM bookings WHERE roomId = ? AND date = ? AND time = ?')
      .bind(roomId, date, time)
      .first();
    
    if (existingBooking) {
      return new Response(JSON.stringify({ error: 'This time slot is already booked' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...handleCors(request) },
      });
    }
    
    // Create new booking
    const bookingId = generateId();
    await env.DB.prepare(`
      INSERT INTO bookings (id, roomId, date, time, email, title, attendees, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      bookingId,
      roomId,
      date,
      time,
      email.toLowerCase(),
      title,
      attendees,
      new Date().toISOString()
    ).run();
    
    const newBooking = { id: bookingId, roomId, date, time, email, title, attendees, createdAt: new Date().toISOString() };
    
    return new Response(JSON.stringify(newBooking), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...handleCors(request) },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...handleCors(request) },
    });
  }
}

// Handle DELETE request to cancel a booking
async function handleDeleteBooking(request, bookingId, env) {
  const booking = await env.DB.prepare('SELECT id FROM bookings WHERE id = ?')
    .bind(bookingId)
    .first();
  
  if (!booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...handleCors(request) },
    });
  }
  
  // Delete the booking
  await env.DB.prepare('DELETE FROM bookings WHERE id = ?')
    .bind(bookingId)
    .run();
  
  return new Response(JSON.stringify({ message: 'Booking cancelled successfully' }), {
    headers: { 'Content-Type': 'application/json', ...handleCors(request) },
  });
}

// Main request handler
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  if (method === 'OPTIONS') {
    return handleOptions(request);
  }
  
  if (path === '/rooms' && method === 'GET') {
    return handleGetRooms(request, env);
  }
  
  if (path.match(/^\/rooms\/\w+$/) && method === 'GET') {
    const roomId = path.split('/').pop();
    return handleGetRoom(request, roomId, env);
  }
  
  if (path === '/bookings' && method === 'GET') {
    return handleGetBookings(request, env);
  }
  
  if (path === '/bookings' && method === 'POST') {
    return handleCreateBooking(request, env);
  }
  
  if (path.match(/^\/bookings\/\w+$/) && method === 'DELETE') {
    const bookingId = path.split('/').pop();
    return handleDeleteBooking(request, bookingId, env);
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...handleCors(request) },
  });
}

// Expose the handler for the Worker
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};