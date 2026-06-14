/**
 * LocoPass - Railway Reservation System (User Panel JS)
 * Developed for BSCS 4th Semester Web Technologies Capstone.
 * 
 * This file handles:
 * 1. Fetching bookings from JSON Server (GET /reservations)
 * 2. Displaying records in HTML using template literal cards
 * 3. Dynamic search filters (Train, Source, Destination, Status)
 * 4. Real-time form validation & ticket fare auto-calculation
 * 5. Creating new reservations (POST /reservations)
 */

// Base API Endpoint
const API_URL = 'http://localhost:3000/reservations';

// DOM Element Selections
const reservationForm = document.getElementById('reservation-form');
const passengerNameInput = document.getElementById('passengerName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const trainNameSelect = document.getElementById('trainName');
const sourceSelect = document.getElementById('source');
const destinationSelect = document.getElementById('destination');
const travelDateInput = document.getElementById('travelDate');
const seatClassSelect = document.getElementById('seatClass');
const estimatedPriceDisplay = document.getElementById('estimated-price');
const submitBtn = document.getElementById('submit-booking-btn');

// Filter Inputs
const filterTrain = document.getElementById('filter-train');
const filterSource = document.getElementById('filter-source');
const filterDestination = document.getElementById('filter-destination');
const filterStatus = document.getElementById('filter-status');

// State Containers
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const reservationsList = document.getElementById('reservations-list');
const retryBtn = document.getElementById('retry-btn');

// Global Cache for Reservations Data
let allReservations = [];

// Base Pricing Matrix (Source City ⇄ Destination City base fares)
const BASE_FARES = {
    "Lahore-Karachi": 3000,
    "Karachi-Lahore": 3000,
    "Lahore-Islamabad": 1500,
    "Islamabad-Lahore": 1500,
    "Lahore-Rawalpindi": 1500,
    "Rawalpindi-Lahore": 1500,
    "Karachi-Islamabad": 3500,
    "Islamabad-Karachi": 3500,
    "Karachi-Rawalpindi": 3500,
    "Rawalpindi-Karachi": 3500,
    "Peshawar-Quetta": 4000,
    "Quetta-Peshawar": 4000,
    "Lahore-Multan": 1200,
    "Multan-Lahore": 1200,
    "Karachi-Multan": 2200,
    "Multan-Karachi": 2200
};

// Seat Class Price Multipliers
const CLASS_MULTIPLIERS = {
    "Economy": 1.0,
    "AC Standard": 1.4,
    "AC Business": 1.8,
    "First Class Sleeper": 2.5
};

/* =========================================================================
   1. Dynamic Price Calculation Logic
   ========================================================================= */

/**
 * Calculates ticket fare dynamically based on selected route and class.
 * Updates the screen preview in real-time.
 */
function calculateTicketPrice() {
    const src = sourceSelect.value;
    const dest = destinationSelect.value;
    const sClass = seatClassSelect.value;

    // Default price if fields are missing
    if (!src || !dest || !sClass) {
        estimatedPriceDisplay.textContent = 'Rs. 0';
        return 0;
    }

    // Source and destination cannot be the same
    if (src === dest) {
        estimatedPriceDisplay.textContent = 'Rs. 0';
        return 0;
    }

    // Lookup base fare, fallback to default base if route not in matrix
    const routeKey = `${src}-${dest}`;
    const baseFare = BASE_FARES[routeKey] || 2000; 

    // Multiply by seat class tier multiplier
    const multiplier = CLASS_MULTIPLIERS[sClass] || 1.0;
    const finalPrice = Math.round(baseFare * multiplier);

    // Render result
    estimatedPriceDisplay.textContent = `Rs. ${finalPrice.toLocaleString()}`;
    return finalPrice;
}

// Bind pricing recalculation to input changes
sourceSelect.addEventListener('change', calculateTicketPrice);
destinationSelect.addEventListener('change', calculateTicketPrice);
seatClassSelect.addEventListener('change', calculateTicketPrice);

/* =========================================================================
   2. Inline Form Validation Logic (No alert() used)
   ========================================================================= */

/**
 * Sets validation error messages on specific fields.
 */
function setError(inputElement, errorElementId, message) {
    const errorSpan = document.getElementById(errorElementId);
    if (message) {
        inputElement.classList.add('input-error');
        errorSpan.textContent = message;
    } else {
        inputElement.classList.remove('input-error');
        errorSpan.textContent = '';
    }
}

/**
 * Validator helpers
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function isValidPhone(phone) {
    // Matches standard Pakistani mobile formats: 03xxxxxxxxx (11 digits)
    const regex = /^03\d{9}$/;
    return regex.test(phone);
}

function isDateInPast(dateStr) {
    if (!dateStr) return false;
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
}

/**
 * Main form validation suite.
 * Evaluates all fields and outputs errors below inputs inline.
 */
function validateForm() {
    let isValid = true;

    // 1. Name Check
    if (passengerNameInput.value.trim() === '') {
        setError(passengerNameInput, 'name-error', 'Passenger name is required.');
        isValid = false;
    } else {
        setError(passengerNameInput, 'name-error', '');
    }

    // 2. Email Format Check
    if (emailInput.value.trim() === '') {
        setError(emailInput, 'email-error', 'Email address is required.');
        isValid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
        setError(emailInput, 'email-error', 'Please enter a valid email address.');
        isValid = false;
    } else {
        setError(emailInput, 'email-error', '');
    }

    // 3. Phone Format Check
    if (phoneInput.value.trim() === '') {
        setError(phoneInput, 'phone-error', 'Phone number is required.');
        isValid = false;
    } else if (!isValidPhone(phoneInput.value.trim())) {
        setError(phoneInput, 'phone-error', 'Enter a valid 11-digit Pakistani phone (e.g. 03001234567).');
        isValid = false;
    } else {
        setError(phoneInput, 'phone-error', '');
    }

    // 4. Train Selection Check
    if (trainNameSelect.value === '') {
        setError(trainNameSelect, 'train-error', 'Please select a train.');
        isValid = false;
    } else {
        setError(trainNameSelect, 'train-error', '');
    }

    // 5. Source Station Check
    if (sourceSelect.value === '') {
        setError(sourceSelect, 'source-error', 'Source city is required.');
        isValid = false;
    } else {
        setError(sourceSelect, 'source-error', '');
    }

    // 6. Destination Station Check
    if (destinationSelect.value === '') {
        setError(destinationSelect, 'destination-error', 'Destination city is required.');
        isValid = false;
    } else {
        setError(destinationSelect, 'destination-error', '');
    }

    // 7. Route Station Overlap Check
    if (sourceSelect.value && destinationSelect.value && sourceSelect.value === destinationSelect.value) {
        setError(sourceSelect, 'source-error', 'Source and destination stations cannot be the same.');
        setError(destinationSelect, 'destination-error', 'Source and destination stations cannot be the same.');
        isValid = false;
    }

    // 8. Travel Date Check
    if (travelDateInput.value === '') {
        setError(travelDateInput, 'date-error', 'Travel date is required.');
        isValid = false;
    } else if (isDateInPast(travelDateInput.value)) {
        setError(travelDateInput, 'date-error', 'Travel date cannot be in the past.');
        isValid = false;
    } else {
        setError(travelDateInput, 'date-error', '');
    }

    // 9. Seat Class Check
    if (seatClassSelect.value === '') {
        setError(seatClassSelect, 'class-error', 'Please select a seat class.');
        isValid = false;
    } else {
        setError(seatClassSelect, 'class-error', '');
    }

    return isValid;
}

// Add keyup/change listeners to remove errors interactively as user types
passengerNameInput.addEventListener('input', () => setError(passengerNameInput, 'name-error', ''));
emailInput.addEventListener('input', () => setError(emailInput, 'email-error', ''));
phoneInput.addEventListener('input', () => setError(phoneInput, 'phone-error', ''));
trainNameSelect.addEventListener('change', () => setError(trainNameSelect, 'train-error', ''));
sourceSelect.addEventListener('change', () => {
    setError(sourceSelect, 'source-error', '');
    if (destinationSelect.value !== sourceSelect.value) {
        setError(destinationSelect, 'destination-error', '');
    }
});
destinationSelect.addEventListener('change', () => {
    setError(destinationSelect, 'destination-error', '');
    if (sourceSelect.value !== destinationSelect.value) {
        setError(sourceSelect, 'source-error', '');
    }
});
travelDateInput.addEventListener('change', () => setError(travelDateInput, 'date-error', ''));
seatClassSelect.addEventListener('change', () => setError(seatClassSelect, 'class-error', ''));


/* =========================================================================
   3. Async API Data Actions (GET, POST)
   ========================================================================= */

/**
 * Fetches all reservations from database.
 */
async function fetchReservations() {
    showLoading();
    try {
        const response = await fetch(API_URL);
        
        // Check if server response is valid
        if (!response.ok) {
            throw new Error(`Server returned status: ${response.status}`);
        }
        
        // Parse database values
        allReservations = await response.json();
        
        // Render current reservations matching filter states
        renderReservations();
    } catch (error) {
        console.error('Fetch reservations failed:', error);
        showError();
    }
}

/**
 * Creates and saves a new reservation record.
 */
async function createReservation(newBooking) {
    try {
        // Disable submit button during active process
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing Booking...';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newBooking)
        });

        if (!response.ok) {
            throw new Error(`Create booking failed: ${response.status}`);
        }

        // Auto Refresh Flow:
        // 1. Clear Form
        reservationForm.reset();
        estimatedPriceDisplay.textContent = 'Rs. 0';
        
        // 2. Re-fetch and update UI
        await fetchReservations();

    } catch (error) {
        console.error('Error creating reservation:', error);
        alert('Failed to place reservation. Please check if the backend database server is running.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Book Reservation';
    }
}

/* =========================================================================
   4. UI Rendering and State Handlers
   ========================================================================= */

/**
 * Displays the loader and hides lists/errors.
 */
function showLoading() {
    loadingState.style.display = 'flex';
    errorState.style.display = 'none';
    reservationsList.style.display = 'none';
}

/**
 * Displays the server connection error block.
 */
function showError() {
    loadingState.style.display = 'none';
    errorState.style.display = 'flex';
    reservationsList.style.display = 'none';
}

/**
 * Renders list cards to index.html with local client filtering.
 */
function renderReservations() {
    // Hide loading & error states
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    reservationsList.style.display = 'flex';

    // Retrieve values from filters
    const filterTName = filterTrain.value.toLowerCase();
    const filterSrc = filterSource.value.toLowerCase();
    const filterDest = filterDestination.value.toLowerCase();
    const filterSt = filterStatus.value.toLowerCase();

    // Perform filter match checks
    const filtered = allReservations.filter(res => {
        const matchTrain = !filterTName || res.trainName.toLowerCase() === filterTName;
        const matchSource = !filterSrc || res.source.toLowerCase() === filterSrc;
        const matchDestination = !filterDest || res.destination.toLowerCase() === filterDest;
        const matchStatus = !filterSt || res.status.toLowerCase() === filterSt;
        return matchTrain && matchSource && matchDestination && matchStatus;
    });

    // Handle empty list cases
    if (filtered.length === 0) {
        reservationsList.innerHTML = `
            <div class="no-records">
                <h3>No Reservations Found</h3>
                <p>Try modifying your filters or submit a new seat booking above.</p>
            </div>
        `;
        return;
    }

    // Build tickets HTML
    let listHTML = '';
    
    // Loop through filtered list
    for (let i = 0; i < filtered.length; i++) {
        const item = filtered[i];
        
        // Check badge type based on status
        const statusBadgeClass = item.status === 'Confirmed' ? 'badge-confirmed' : 'badge-pending';
        
        listHTML += `
            <article class="ticket-card" id="ticket-${item.id}">
                <div class="ticket-header">
                    <div class="ticket-train-info">
                        <span>🚆</span>
                        <h3 class="ticket-train-name">${item.trainName}</h3>
                    </div>
                    <span class="badge ${statusBadgeClass}">${item.status}</span>
                </div>
                
                <div class="ticket-route">
                    <div class="route-node">
                        <span class="route-city">${item.source}</span>
                        <span class="route-label">Source</span>
                    </div>
                    <div class="route-arrow">➔</div>
                    <div class="route-node">
                        <span class="route-city">${item.destination}</span>
                        <span class="route-label">Destination</span>
                    </div>
                </div>

                <div class="ticket-details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Travel Date</span>
                        <span class="detail-value">${item.travelDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Seat Class</span>
                        <span class="detail-value">${item.seatClass}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Ticket ID</span>
                        <span class="detail-value">#RES-260${item.id}</span>
                    </div>
                </div>

                <div class="ticket-footer">
                    <div class="ticket-passenger">
                        <span class="passenger-name">${item.passengerName}</span>
                        <span class="passenger-contact">${item.phone} | ${item.email}</span>
                    </div>
                    <span class="ticket-price-badge">Rs. ${item.ticketPrice.toLocaleString()}</span>
                </div>
            </article>
        `;
    }

    reservationsList.innerHTML = listHTML;
}

// Bind filter list changes to fire immediately
filterTrain.addEventListener('change', renderReservations);
filterSource.addEventListener('change', renderReservations);
filterDestination.addEventListener('change', renderReservations);
filterStatus.addEventListener('change', renderReservations);

// Retry connection button trigger
retryBtn.addEventListener('click', fetchReservations);

/* =========================================================================
   5. Form Submission Event Handler
   ========================================================================= */
reservationForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Stop standard browser page navigation refresh

    // Perform validation check
    if (!validateForm()) {
        console.warn('Booking form has validation errors. Submission halted.');
        return; 
    }

    // Construct request object from form data
    const newReservation = {
        passengerName: passengerNameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        trainName: trainNameSelect.value,
        source: sourceSelect.value,
        destination: destinationSelect.value,
        travelDate: travelDateInput.value,
        seatClass: seatClassSelect.value,
        ticketPrice: calculateTicketPrice(),
        status: 'Confirmed' // Default state for user reservations
    };

    // Send payload to json-server database
    createReservation(newReservation);
});

/* =========================================================================
   6. System Initialization
   ========================================================================= */
// Perform first fetch on document load
document.addEventListener('DOMContentLoaded', fetchReservations);
