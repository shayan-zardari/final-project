// Define in-memory data storage (in a real application, you would use a persistent database like D1)
let rooms = [
    {
      id: '1',
      name: 'Executive Room',
      capacity: 10,
      features: ['Projector', 'Whiteboard', 'Video conferencing']
    },
    {
      id: '2',
      name: 'Conference Room A',
      capacity: 20,
      features: ['Projector', 'Whiteboard', 'Large display']
    },
    {
      id: '3',
      name: 'Meeting Room B',
      capacity: 8,
      features: ['Whiteboard', 'Video conferencing']
    },
    {
      id: '4',
      name: 'Brainstorming Space',
      capacity: 6,
      features: ['Whiteboards', 'Flexible seating']
    },
    {
      id: '5',
      name: 'Large Auditorium',
      capacity: 50,
      features: ['Stage', 'Sound system', 'Multiple displays']
    }
  ];
  
  let bookings = [];
  
  // Helper function to generate random booking ID
  function generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  // Helper function to handle CORS headers
  function handleCors(request) {
    // Make sure the request has an origin header
    const origin = request.headers.get('Origin') || '*';
    
    // Return CORS headers
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
  async function handleGetRooms(request) {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    
    if (!date) {
      return new Response(JSON.stringify({ error: 'Date parameter is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...handleCors(request),
        },
      });
    }
    
    return new Response(JSON.stringify(rooms), {
      headers: {
        'Content-Type': 'application/json',
        ...handleCors(request),
      },
    });
  }
  
  // Handle GET request to fetch a specific room with availability
  async function handleGetRoom(request, roomId) {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    
    if (!date) {
      return new Response(JSON.stringify({ error: 'Date parameter is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...handleCors(request),
        },
      });
    }
    
    const room = rooms.find(r => r.id === roomId);
    
    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...handleCors(request),
        },
      });
    }
    
    // Find booked time slots for this room on the specified date
    const bookedSlots = bookings
      .filter(b => b.roomId === roomId && b.date === date)
      .map(b => b.time);
    
    const roomWithAvailability = {
      ...room,
      bookedSlots,
    };
    
    return new Response(JSON.stringify(roomWithAvailability), {
      headers: {
        'Content-Type': 'application/json',
        ...handleCors(request),
      },
    });
  }
  
  // Handle GET request to fetch bookings for a specific email
  async function handleGetBookings(request) {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email parameter is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...handleCors(request),
        },
      });
    }
    
    const userBookings = bookings
      .filter(b => b.email.toLowerCase() === email.toLowerCase())
      .map(booking => {
        const room = rooms.find(r => r.id === booking.roomId);
        return {
          ...booking,
          roomName: room ? room.name : 'Unknown Room'
        };
      });
    
    return new Response(JSON.stringify(userBookings), {
      headers: {
        'Content-Type': 'application/json',
        ...handleCors(request),
      },
    });
  }
  
  // Handle POST request to create a new booking
  async function handleCreateBooking(request) {
    try {
      const data = await request.json();
      const { roomId, date, time, email, title, attendees } = data;
      
      if (!roomId || !date || !time || !email || !title || !attendees) {
        return new Response(JSON.stringify({ error: 'All fields are required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...handleCors(request),
          },
        });
      }
      
      // Check if the room exists
      const room = rooms.find(r => r.id === roomId);
      if (!room) {
        return new Response(JSON.stringify({ error: 'Room not found' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...handleCors(request),
          },
        });
      }
      
      // Check if the room is already booked for this time slot
      const isBooked = bookings.some(b => 
        b.roomId === roomId && 
        b.date === date && 
        b.time === time
      );
      
      if (isBooked) {
        return new Response(JSON.stringify({ error: 'This time slot is already booked' }), {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
            ...handleCors(request),
          },
        });
      }
      
      // Create new booking
      const newBooking = {
        id: generateId(),
        roomId,
        date,
        time,
        email,
        title,
        attendees,
        createdAt: new Date().toISOString()
      };
      
      bookings.push(newBooking);
      
      return new Response(JSON.stringify(newBooking), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...handleCors(request),
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...handleCors(request),
        },
      });
    }
  }
  
  // Handle DELETE request to cancel a booking
  async function handleDeleteBooking(request, bookingId) {
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...handleCors(request),
        },
      });
    }
    
    // Remove the booking
    bookings.splice(bookingIndex, 1);
    
    return new Response(JSON.stringify({ message: 'Booking cancelled successfully' }), {
      headers: {
        'Content-Type': 'application/json',
        ...handleCors(request),
      },
    });
  }
  
  // Main request handler
  async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      return handleOptions(request);
    }
    
    // Route requests based on path and method
    if (path === '/rooms' && method === 'GET') {
      return handleGetRooms(request);
    }
    
    if (path.match(/^\/rooms\/\w+$/) && method === 'GET') {
      const roomId = path.split('/').pop();
      return handleGetRoom(request, roomId);
    }
    
    if (path === '/bookings' && method === 'GET') {
      return handleGetBookings(request);
    }
    
    if (path === '/bookings' && method === 'POST') {
      return handleCreateBooking(request);
    }
    
    if (path.match(/^\/bookings\/\w+$/) && method === 'DELETE') {
      const bookingId = path.split('/').pop();
      return handleDeleteBooking(request, bookingId);
    }
    
    // If no routes match, return 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...handleCors(request),
      },
    });
  }
  
  // Expose the handler for the Worker
  addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });