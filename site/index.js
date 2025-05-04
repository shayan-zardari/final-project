 // Global variables
 const API_URL = 'https://conference-booking-api.shayan-hussainzardari.workers.dev';
 let selectedTimeSlot = null;

 // Helper functions
 function formatDate(dateString) {
     const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
     return new Date(dateString).toLocaleDateString(undefined, options);
 }

 function formatTime(timeString) {
     const [hours, minutes] = timeString.split(':');
     const amPm = hours >= 12 ? 'PM' : 'AM';
     const hour = hours % 12 || 12;
     return `${hour}:${minutes} ${amPm}`;
 }

 // Tab functionality
 document.querySelectorAll('.tab').forEach(tab => {
     tab.addEventListener('click', () => {
         // Remove active class from all tabs and contents
         document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
         document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
         
         // Add active class to clicked tab and corresponding content
         tab.classList.add('active');
         const tabId = tab.getAttribute('data-tab');
         document.getElementById(tabId).classList.add('active');
     });
 });

 // Modal functionality
 const modal = document.getElementById('booking-modal');
 const modalClose = document.querySelector('.modal-close');

 modalClose.addEventListener('click', () => {
     modal.style.display = 'none';
 });

 window.addEventListener('click', (event) => {
     if (event.target === modal) {
         modal.style.display = 'none';
     }
 });

 // Load rooms
 document.getElementById('search-rooms').addEventListener('click', async () => {
     const date = document.getElementById('booking-date').value;
     
     if (!date) {
         alert('Please select a date');
         return;
     }

     document.getElementById('rooms-loading').style.display = 'block';
     document.getElementById('rooms-grid').innerHTML = '';

     try {
         const response = await fetch(`${API_URL}/rooms?date=${date}`);
         const rooms = await response.json();

         document.getElementById('rooms-loading').style.display = 'none';
         
         if (rooms.length === 0) {
             document.getElementById('rooms-grid').innerHTML = '<p>No rooms available for the selected date.</p>';
             return;
         }

         const roomsGrid = document.getElementById('rooms-grid');
         roomsGrid.innerHTML = '';

         rooms.forEach(room => {
             const roomCard = document.createElement('div');
             roomCard.className = 'room-card';
             roomCard.innerHTML = `
                 <div class="room-image">Room ${room.id}</div>
                 <h3>${room.name}</h3>
                 <p>Capacity: ${room.capacity} people</p>
                 <p>Features: ${room.features.join(', ')}</p>
                 <button class="book-room" data-room-id="${room.id}">Check Availability</button>
             `;
             roomsGrid.appendChild(roomCard);
         });

         // Add event listeners to book buttons
         document.querySelectorAll('.book-room').forEach(button => {
             button.addEventListener('click', async () => {
                 const roomId = button.getAttribute('data-room-id');
                 const date = document.getElementById('booking-date').value;

                 try {
                     const response = await fetch(`${API_URL}/rooms/${roomId}?date=${date}`);
                     const roomData = await response.json();

                     // Populate and show modal
                     document.getElementById('modal-room-name').value = roomData.name;
                     document.getElementById('modal-room-id').value = roomData.id;
                     document.getElementById('modal-date').value = date;
                     
                     // Create time slots
                     const timeSlotContainer = document.getElementById('modal-time-slots');
                     timeSlotContainer.innerHTML = '';
                     
                     const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
                     
                     timeSlots.forEach(time => {
                         const isBooked = roomData.bookedSlots && roomData.bookedSlots.includes(time);
                         const slot = document.createElement('div');
                         slot.className = `time-slot ${isBooked ? 'booked' : 'available'}`;
                         slot.textContent = formatTime(time);
                         slot.setAttribute('data-time', time);
                         
                         if (!isBooked) {
                             slot.addEventListener('click', () => {
                                 document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                                 slot.classList.add('selected');
                                 selectedTimeSlot = time;
                             });
                         }
                         
                         timeSlotContainer.appendChild(slot);
                     });

                     // Reset form and messages
                     document.getElementById('booking-success').style.display = 'none';
                     document.getElementById('booking-error').style.display = 'none';
                     
                     // Get email from the other tab if available
                     const userEmail = document.getElementById('user-email').value;
                     if (userEmail) {
                         document.getElementById('modal-email').value = userEmail;
                     }

                     // Show modal
                     modal.style.display = 'flex';
                 } catch (error) {
                     console.error('Error fetching room details:', error);
                     alert('Error loading room details. Please try again.');
                 }
             });
         });
     } catch (error) {
         console.error('Error fetching rooms:', error);
         document.getElementById('rooms-loading').style.display = 'none';
         document.getElementById('rooms-grid').innerHTML = '<p>Error loading rooms. Please try again.</p>';
     }
 });

 // Create booking
 document.getElementById('create-booking').addEventListener('click', async () => {
     const roomId = document.getElementById('modal-room-id').value;
     const date = document.getElementById('modal-date').value;
     const email = document.getElementById('modal-email').value;
     const title = document.getElementById('modal-title').value;
     const attendees = document.getElementById('modal-attendees').value;
     
     if (!selectedTimeSlot) {
         alert('Please select a time slot');
         return;
     }

     if (!email || !title || !attendees) {
         alert('Please fill out all fields');
         return;
     }

     try {
         const response = await fetch(`${API_URL}/bookings`, {
             method: 'POST',
             headers: {
                 'Content-Type': 'application/json',
             },
             body: JSON.stringify({
                 roomId,
                 date,
                 time: selectedTimeSlot,
                 email,
                 title,
                 attendees: parseInt(attendees)
             }),
         });

         const result = await response.json();

         if (response.ok) {
             document.getElementById('booking-success').style.display = 'block';
             document.getElementById('booking-error').style.display = 'none';
             
             // Copy email to the other tab
             document.getElementById('user-email').value = email;
             
             // Disable the selected time slot
             const timeSlot = document.querySelector(`.time-slot[data-time="${selectedTimeSlot}"]`);
             if (timeSlot) {
                 timeSlot.classList.remove('selected', 'available');
                 timeSlot.classList.add('booked');
                 timeSlot.removeEventListener('click', () => {});
             }
             
             // Reset selected time slot
             selectedTimeSlot = null;
             
             // Wait a bit and then close the modal
             setTimeout(() => {
                 modal.style.display = 'none';
             }, 2000);
         } else {
             document.getElementById('booking-error').style.display = 'block';
             document.getElementById('booking-error').textContent = result.message || 'Error creating booking';
             document.getElementById('booking-success').style.display = 'none';
         }
     } catch (error) {
         console.error('Error creating booking:', error);
         document.getElementById('booking-error').style.display = 'block';
         document.getElementById('booking-error').textContent = 'Network error. Please try again.';
         document.getElementById('booking-success').style.display = 'none';
     }
 });

 // Load bookings
 document.getElementById('load-bookings').addEventListener('click', async () => {
     const email = document.getElementById('user-email').value;
     
     if (!email) {
         alert('Please enter your email');
         return;
     }

     document.getElementById('bookings-loading').style.display = 'block';
     document.getElementById('booking-list').innerHTML = '';

     try {
         const response = await fetch(`${API_URL}/bookings?email=${encodeURIComponent(email)}`);
         const bookings = await response.json();

         document.getElementById('bookings-loading').style.display = 'none';
         
         if (bookings.length === 0) {
             document.getElementById('booking-list').innerHTML = '<p>No bookings found for this email.</p>';
             return;
         }

         const bookingList = document.getElementById('booking-list');
         bookingList.innerHTML = '';

         bookings.forEach(booking => {
             const bookingItem = document.createElement('div');
             bookingItem.className = 'booking-item';
             bookingItem.innerHTML = `
                 <div class="booking-info">
                     <h3>${booking.title}</h3>
                     <p><strong>Room:</strong> ${booking.roomName}</p>
                     <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
                     <p><strong>Time:</strong> ${formatTime(booking.time)}</p>
                     <p><strong>Attendees:</strong> ${booking.attendees}</p>
                 </div>
                 <button class="danger cancel-booking" data-booking-id="${booking.id}">Cancel</button>
             `;
             bookingList.appendChild(bookingItem);
         });

         // Add event listeners to cancel buttons
         document.querySelectorAll('.cancel-booking').forEach(button => {
             button.addEventListener('click', async () => {
                 const bookingId = button.getAttribute('data-booking-id');
                 if (confirm('Are you sure you want to cancel this booking?')) {
                     try {
                         const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
                             method: 'DELETE',
                         });

                         if (response.ok) {
                             button.closest('.booking-item').remove();
                             if (document.querySelectorAll('.booking-item').length === 0) {
                                 document.getElementById('booking-list').innerHTML = '<p>No bookings found for this email.</p>';
                             }
                         } else {
                             alert('Error cancelling booking. Please try again.');
                         }
                     } catch (error) {
                         console.error('Error cancelling booking:', error);
                         alert('Network error. Please try again.');
                     }
                 }
             });
         });
     } catch (error) {
         console.error('Error fetching bookings:', error);
         document.getElementById('bookings-loading').style.display = 'none';
         document.getElementById('booking-list').innerHTML = '<p>Error loading bookings. Please try again.</p>';
     }
 });