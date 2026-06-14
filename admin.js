/**
 * LocoPass - Railway Reservation System (Admin Panel JS)
 * Developed for BSCS 4th Semester Web Technologies Capstone.
 * 
 * This file handles:
 * 1. Fetching all reservations (GET /reservations)
 * 2. Calculating and displaying summary statistics:
 *    - Total Reservations
 *    - Confirmed Tickets count
 *    - Average Ticket Price (Rs.)
 * 3. Populating and opening the Edit Form panel (Drawer)
 * 4. Submitting updates via PATCH (PATCH /reservations/:id)
 * 5. Deleting bookings via DELETE (DELETE /reservations/:id) with confirmation checks
 */

// Base API Endpoint
const API_URL = 'http://localhost:3000/reservations';

// DOM Element Selections for Stats
const statsTotalVal = document.getElementById('stats-total');
const statsConfirmedVal = document.getElementById('stats-confirmed');
const statsAverageVal = document.getElementById('stats-average');

// DOM Element Selections for UI States
const tableBody = document.getElementById('admin-reservations-table-body');
const loadingState = document.getElementById('admin-loading-state');
const errorState = document.getElementById('admin-error-state');
const tableContainer = document.getElementById('admin-table-container');
const retryBtn = document.getElementById('admin-retry-btn');
const filterStatus = document.getElementById('admin-filter-status');

// DOM Element Selections for Edit Drawer
const editDrawerPanel = document.getElementById('edit-drawer-panel');
const editForm = document.getElementById('edit-reservation-form');
const editIdInput = document.getElementById('edit-res-id');
const editPassengerNameInput = document.getElementById('editPassengerName');
const editEmailInput = document.getElementById('editEmail');
const editPhoneInput = document.getElementById('editPhone');
const editTrainNameSelect = document.getElementById('editTrainName');
const editSourceSelect = document.getElementById('editSource');
const editDestinationSelect = document.getElementById('editDestination');
const editTravelDateInput = document.getElementById('editTravelDate');
const editSeatClassSelect = document.getElementById('editSeatClass');
const editTicketPriceInput = document.getElementById('editTicketPrice');
const editStatusSelect = document.getElementById('editStatus');

const cancelEditBtn = document.getElementById('cancel-edit-btn');
const discardEditBtn = document.getElementById('discard-edit-btn');
const saveEditBtn = document.getElementById('save-edit-btn');

// Global Cache for Reservations Data
let allReservations = [];

/* =========================================================================
   1. Statistics Calculations
   ========================================================================= */

/**
 * Computes and renders: Total Reservations, Confirmed Tickets, and Average Price.
 */
function calculateStatistics() {
    const total = allReservations.length;
    
    // 1. Total Reservations count
    statsTotalVal.textContent = total;

    // 2. Confirmed Tickets count
    let confirmedCount = 0;
    for (let i = 0; i < total; i++) {
        if (allReservations[i].status === 'Confirmed') {
            confirmedCount++;
        }
    }
    statsConfirmedVal.textContent = confirmedCount;

    // 3. Average Ticket Price
    if (total === 0) {
        statsAverageVal.textContent = 'Rs. 0';
        return;
    }

    let totalPriceSum = 0;
    for (let i = 0; i < total; i++) {
        totalPriceSum += Number(allReservations[i].ticketPrice) || 0;
    }
    const average = Math.round(totalPriceSum / total);
    
    statsAverageVal.textContent = `Rs. ${average.toLocaleString()}`;
}

/* =========================================================================
   2. Fetch and Render Data Table
   ========================================================================= */

/**
 * Loads all reservations from JSON server.
 */
async function fetchReservations() {
    showLoading();
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`Server returned error code: ${response.status}`);
        }
        
        allReservations = await response.json();
        
        // Compute metrics
        calculateStatistics();
        
        // Draw rows
        renderReservations();
    } catch (error) {
        console.error('Fetch reservations failed:', error);
        showError();
    }
}

/**
 * Renders reservation table rows to screen.
 */
function renderReservations() {
    // Hide loader and error elements
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    tableContainer.style.display = 'block';

    const selectedFilterStatus = filterStatus.value.toLowerCase();

    // Apply client-side status filter if chosen
    const filtered = allReservations.filter(res => {
        return !selectedFilterStatus || res.status.toLowerCase() === selectedFilterStatus;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    No bookings found in database matching your filters.
                </td>
            </tr>
        `;
        return;
    }

    // Build row templates
    let rowsHTML = '';
    
    for (let i = 0; i < filtered.length; i++) {
        const item = filtered[i];
        const statusBadgeClass = item.status === 'Confirmed' ? 'badge-confirmed' : 'badge-pending';
        
        rowsHTML += `
            <tr id="row-${item.id}">
                <td><strong>#${item.id}</strong></td>
                <td>
                    <div class="table-passenger-info">
                        <span class="table-passenger-name">${item.passengerName}</span>
                        <span class="table-passenger-contact">${item.phone}</span>
                        <span class="table-passenger-contact" style="opacity: 0.7;">${item.email}</span>
                    </div>
                </td>
                <td>${item.trainName}</td>
                <td>
                    <div style="font-weight: 500;">${item.source} ➔ ${item.destination}</div>
                </td>
                <td>${item.travelDate}</td>
                <td>${item.seatClass}</td>
                <td><strong>Rs. ${item.ticketPrice.toLocaleString()}</strong></td>
                <td><span class="badge ${statusBadgeClass}">${item.status}</span></td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-secondary btn-sm" onclick="startEditing(${item.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteBooking(${item.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `;
    }

    tableBody.innerHTML = rowsHTML;
}

// Bind table filters to update immediately
filterStatus.addEventListener('change', renderReservations);
retryBtn.addEventListener('click', fetchReservations);

/* =========================================================================
   3. Delete Reservation Operation
   ========================================================================= */

/**
 * Removes a booking record by sending a DELETE request to server.
 * Prompts user confirmation check beforehand.
 */
async function deleteBooking(id) {
    // 1. Confirm dialog
    const userWantsToDelete = confirm("Are you sure you want to delete this reservation?");
    if (!userWantsToDelete) {
        return; // Halt if administrator cancels
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`DELETE request failed: ${response.status}`);
        }

        // Check if deleted item is currently loaded in the Edit Drawer
        if (editIdInput.value === String(id)) {
            closeEditDrawer();
        }

        // Re-fetch database items to refresh lists and metrics
        await fetchReservations();

    } catch (error) {
        console.error('Delete request failed:', error);
        alert('Failed to delete reservation. Please verify server status.');
    }
}

/* =========================================================================
   4. Edit Reservation Operations
   ========================================================================= */

/**
 * Opens edit drawer and loads targeted record details.
 */
function startEditing(id) {
    // Find record by matching database ID in our cached cache list
    const bookingToEdit = allReservations.find(res => res.id === id);
    if (!bookingToEdit) {
        console.error(`Record ID ${id} not found in state cache.`);
        return;
    }

    // Populate values into fields
    editIdInput.value = bookingToEdit.id;
    editPassengerNameInput.value = bookingToEdit.passengerName;
    editEmailInput.value = bookingToEdit.email;
    editPhoneInput.value = bookingToEdit.phone;
    editTrainNameSelect.value = bookingToEdit.trainName;
    editSourceSelect.value = bookingToEdit.source;
    editDestinationSelect.value = bookingToEdit.destination;
    editTravelDateInput.value = bookingToEdit.travelDate;
    editSeatClassSelect.value = bookingToEdit.seatClass;
    editTicketPriceInput.value = bookingToEdit.ticketPrice;
    editStatusSelect.value = bookingToEdit.status;

    // Reset old validation highlights
    clearEditErrors();

    // Slide open drawer
    editDrawerPanel.classList.add('active');
    
    // Smooth scroll to editor
    editDrawerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Closes the editing drawer.
 */
function closeEditDrawer() {
    editDrawerPanel.classList.remove('active');
    editForm.reset();
    clearEditErrors();
}

cancelEditBtn.addEventListener('click', closeEditDrawer);
discardEditBtn.addEventListener('click', closeEditDrawer);

/**
 * Sets validation error messages on edit fields.
 */
function setEditError(inputElement, errorElementId, message) {
    const errorSpan = document.getElementById(errorElementId);
    if (message) {
        inputElement.classList.add('input-error');
        errorSpan.textContent = message;
    } else {
        inputElement.classList.remove('input-error');
        errorSpan.textContent = '';
    }
}

function clearEditErrors() {
    setEditError(editPassengerNameInput, 'edit-name-error', '');
    setEditError(editEmailInput, 'edit-email-error', '');
    setEditError(editPhoneInput, 'edit-phone-error', '');
    setEditError(editTrainNameSelect, 'edit-train-error', '');
    setEditError(editSourceSelect, 'edit-source-error', '');
    setEditError(editDestinationSelect, 'edit-destination-error', '');
    setEditError(editTravelDateInput, 'edit-date-error', '');
    setEditError(editSeatClassSelect, 'edit-class-error', '');
    setEditError(editTicketPriceInput, 'edit-price-error', '');
    setEditError(editStatusSelect, 'edit-status-error', '');
}

/**
 * Helper validator rules (reused from index logic)
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function isValidPhone(phone) {
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
 * Validates the admin editor parameters.
 */
function validateEditForm() {
    let isValid = true;

    if (editPassengerNameInput.value.trim() === '') {
        setEditError(editPassengerNameInput, 'edit-name-error', 'Name is required.');
        isValid = false;
    }
    
    if (editEmailInput.value.trim() === '') {
        setEditError(editEmailInput, 'edit-email-error', 'Email is required.');
        isValid = false;
    } else if (!isValidEmail(editEmailInput.value.trim())) {
        setEditError(editEmailInput, 'edit-email-error', 'Enter a valid email.');
        isValid = false;
    }
    
    if (editPhoneInput.value.trim() === '') {
        setEditError(editPhoneInput, 'edit-phone-error', 'Phone is required.');
        isValid = false;
    } else if (!isValidPhone(editPhoneInput.value.trim())) {
        setEditError(editPhoneInput, 'edit-phone-error', 'Enter a valid 11-digit Pakistani phone (03xxxxxxxxx).');
        isValid = false;
    }
    
    if (editTrainNameSelect.value === '') {
        setEditError(editTrainNameSelect, 'edit-train-error', 'Select a train.');
        isValid = false;
    }
    
    if (editSourceSelect.value === '') {
        setEditError(editSourceSelect, 'edit-source-error', 'Select source station.');
        isValid = false;
    }
    
    if (editDestinationSelect.value === '') {
        setEditError(editDestinationSelect, 'edit-destination-error', 'Select destination station.');
        isValid = false;
    }
    
    if (editSourceSelect.value && editDestinationSelect.value && editSourceSelect.value === editDestinationSelect.value) {
        setEditError(editSourceSelect, 'edit-source-error', 'Source and destination cannot be identical.');
        setEditError(editDestinationSelect, 'edit-destination-error', 'Source and destination cannot be identical.');
        isValid = false;
    }
    
    if (editTravelDateInput.value === '') {
        setEditError(editTravelDateInput, 'edit-date-error', 'Select date.');
        isValid = false;
    } else if (isDateInPast(editTravelDateInput.value)) {
        setEditError(editTravelDateInput, 'edit-date-error', 'Travel date cannot be in the past.');
        isValid = false;
    }
    
    if (editSeatClassSelect.value === '') {
        setEditError(editSeatClassSelect, 'edit-class-error', 'Select class.');
        isValid = false;
    }
    
    if (editTicketPriceInput.value === '' || Number(editTicketPriceInput.value) < 0) {
        setEditError(editTicketPriceInput, 'edit-price-error', 'Enter a valid price >= 0.');
        isValid = false;
    }
    
    if (editStatusSelect.value === '') {
        setEditError(editStatusSelect, 'edit-status-error', 'Select status.');
        isValid = false;
    }

    return isValid;
}

// Interactively clear errors on input changes
editPassengerNameInput.addEventListener('input', () => setEditError(editPassengerNameInput, 'edit-name-error', ''));
editEmailInput.addEventListener('input', () => setEditError(editEmailInput, 'edit-email-error', ''));
editPhoneInput.addEventListener('input', () => setEditError(editPhoneInput, 'edit-phone-error', ''));
editTrainNameSelect.addEventListener('change', () => setEditError(editTrainNameSelect, 'edit-train-error', ''));
editSourceSelect.addEventListener('change', () => {
    setEditError(editSourceSelect, 'edit-source-error', '');
    if (editSourceSelect.value !== editDestinationSelect.value) {
        setEditError(editDestinationSelect, 'edit-destination-error', '');
    }
});
editDestinationSelect.addEventListener('change', () => {
    setEditError(editDestinationSelect, 'edit-destination-error', '');
    if (editDestinationSelect.value !== editSourceSelect.value) {
        setEditError(editSourceSelect, 'edit-source-error', '');
    }
});
editTravelDateInput.addEventListener('change', () => setEditError(editTravelDateInput, 'edit-date-error', ''));
editSeatClassSelect.addEventListener('change', () => setEditError(editSeatClassSelect, 'edit-class-error', ''));
editTicketPriceInput.addEventListener('input', () => setEditError(editTicketPriceInput, 'edit-price-error', ''));
editStatusSelect.addEventListener('change', () => setEditError(editStatusSelect, 'edit-status-error', ''));

/**
 * Form submission handler for saving edit updates using PATCH/PUT.
 */
editForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    if (!validateEditForm()) {
        console.warn('Edit form contains errors. Cannot update.');
        return;
    }

    const id = editIdInput.value;
    const updatedData = {
        passengerName: editPassengerNameInput.value.trim(),
        email: editEmailInput.value.trim(),
        phone: editPhoneInput.value.trim(),
        trainName: editTrainNameSelect.value,
        source: editSourceSelect.value,
        destination: editDestinationSelect.value,
        travelDate: editTravelDateInput.value,
        seatClass: editSeatClassSelect.value,
        ticketPrice: Number(editTicketPriceInput.value),
        status: editStatusSelect.value
    };

    try {
        saveEditBtn.disabled = true;
        saveEditBtn.textContent = 'Updating...';

        // Using standard PUT/PATCH to save the updated booking to endpoint
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            throw new Error(`Failed to update booking status: ${response.status}`);
        }

        // Close drawer on successful edit save
        closeEditDrawer();

        // Refresh calculations and listing
        await fetchReservations();

    } catch (error) {
        console.error('Update request error:', error);
        alert('Failed to update booking. Check database server connection.');
    } finally {
        saveEditBtn.disabled = false;
        saveEditBtn.textContent = 'Save Changes';
    }
});

/* =========================================================================
   5. UI State Handlers
   ========================================================================= */

function showLoading() {
    loadingState.style.display = 'flex';
    errorState.style.display = 'none';
    tableContainer.style.display = 'none';
}

function showError() {
    loadingState.style.display = 'none';
    errorState.style.display = 'flex';
    tableContainer.style.display = 'none';
}

// Make globally accessible since table buttons are generated dynamically as HTML strings
window.startEditing = startEditing;
window.deleteBooking = deleteBooking;

/* =========================================================================
   6. System Initialization
   ========================================================================= */
document.addEventListener('DOMContentLoaded', fetchReservations);
