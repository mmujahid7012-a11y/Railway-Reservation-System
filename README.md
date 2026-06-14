# LocoPass - Railway Reservation System

A complete, responsive, and modern Railway Reservation System web application built for a Web Technologies capstone project. This application allows passengers to search, filter, and book train tickets in real-time, while administrators can oversee bookings, update tickets, track operational metrics, and manage the reservation database.

---

## 🎓 Student Information
* **Student Name:** [Your Name Here]
* **Roll Number:** [Your Roll Number Here]
* **Course:** BSCS 4th Semester (Web Technologies Capstone Project)

---

## 📝 Project Description
This project is a modern, lightweight, server-backed web application implemented without external libraries or frameworks (such as React, Tailwind, Bootstrap, or jQuery). It utilizes **Vanilla HTML5 semantic markup**, **custom CSS Grid/Flexbox design**, **plain JavaScript ES6+**, and a local **JSON Server** backend representing a RESTful API database.

All interactions with the database are asynchronous using standard `async/await` syntax with comprehensive `try/catch` handlers for resilient network error management.

---

## 🚀 Key Features

### 1. Passenger Booking Panel (`index.html` / `app.js`)
* **Real-time Bookings Feed**: Automatically fetches and lists existing reservations.
* **Inline Form Validation**: Immediate checking of booking rules without using invasive browser `alert()` popups:
  * Passenger Name is mandatory.
  * Email must match a standard format.
  * Phone must be a valid 11-digit Pakistani mobile format (starting with `03`).
  * Travel Date must be today or in the future (past dates are disabled).
  * Source and Destination stations cannot be identical.
  * Seat class selection is required.
* **Live Price Estimator**: Recalculates ticket pricing dynamically on the client side whenever stations or seat classes are changed.
* **Dynamic Search Filtering**: Instantly filters reservations on change by Train Name, Source Station, Destination Station, or Reservation Status.
* **Loading & Connection Error Indicators**: Animated loading spinner when fetching, and clean fallback cards if the database server is offline.
* **Auto Refresh**: Resets the booking form and refreshes listing data instantly upon successful seat reservation.

### 2. Administrator Dashboard (`admin.html` / `admin.js`)
* **Different Visual Theme**: Implements a dedicated dark charcoal and amber/gold theme to clearly delineate administration operations from consumer booking pages.
* **Live Statistics Metrics**:
  * **Total Reservations**: Current count of bookings in the database.
  * **Confirmed Tickets**: Number of reservations with a "Confirmed" status.
  * **Average Ticket Price**: Computes average price of all tickets in the system.
* **Database Grid (Table)**: Responsive table listing detailed passenger information, selected trains, pricing, dates, and status badges.
* **Edit/Update Drawer (PATCH/PUT)**: Loads records into an editing form, scrolls the admin panel into view, validates adjustments, and submits revisions to `PATCH /reservations/:id`.
* **Delete Record (DELETE)**: Displays standard browser verification `confirm("Are you sure?")` before sending a `DELETE /reservations/:id` request to the backend.

---

## 🛠️ Technology Stack
* **Frontend Structure**: Semantic HTML5 (`<nav>`, `<main>`, `<section>`, `<form>`, `<label>`, etc.)
* **Styling System**: CSS3 Custom Grid, Flexbox layouts, Transitions, and CSS Variables theme configurations.
* **Programming Logic**: Vanilla JS (ES6+), DOM APIs, Event Listeners.
* **Networking**: Fetch API with `async/await` and HTTP standard verbs (`GET`, `POST`, `PATCH`, `DELETE`).
* **Database Backend**: Local JSON Server feeding from `db.json`.

---

## 📥 Installation & Run Guide

### Step 1: Install JSON Server
Make sure you have [Node.js](https://nodejs.org/) installed. Install the global `json-server` utility via terminal:
```bash
npm install -g json-server
```

### Step 2: Start the Local Database Server
Navigate to the project directory and launch JSON Server on port 3000 to watch your database:
```bash
npx json-server --watch db.json --port 3000
```
This sets up the endpoint: `http://localhost:3000/reservations`.

### Step 3: Run the Frontend
Simply double-click or open the following HTML pages in any modern browser:
* **Passenger Portal**: Open [index.html](file:///c:/Users/M%20MUJAHID/OneDrive/Desktop/Railway%20Reservation%20System/index.html)
* **Admin Dashboard**: Open [admin.html](file:///c:/Users/M%20MUJAHID/OneDrive/Desktop/Railway%20Reservation%20System/admin.html)

---

## 💡 Viva Q&A Preparation Notes (BSCS 4th Sem)

When presenting this project to examiners, be prepared to answer the following questions:

### 1. What is the benefit of `async/await` over standard Promises/Callbacks?
> **Answer:** `async/await` is syntactic sugar built on top of standard JavaScript Promises. It allows asynchronous code to be written and read like synchronous code, avoiding nested "callback hell" or long `.then()` chains. It makes code simpler to read, maintain, and debug.

### 2. Why are we using `try/catch` blocks in all fetch queries?
> **Answer:** Network operations can fail due to server downtime, incorrect URLs, or offline user connections. Wrapping fetches inside `try/catch` blocks captures runtime exceptions gracefully, allowing us to hide loading animations and show clear user-friendly error cards ("Unable to connect to server.") instead of crashing the browser console.

### 3. How does the server differentiate a POST, PUT/PATCH, and DELETE request?
> **Answer:** These represent RESTful HTTP verbs:
> * **GET**: Reads data. Does not modify database state.
> * **POST**: Submits new database entries.
> * **PUT / PATCH**: Updates existing database entries. `PATCH` changes specific fields supplied in the payload body, whereas `PUT` replaces the entire record.
> * **DELETE**: Removes the database entry.

### 4. What are CSS Custom Variables and how do they power the theme separation?
> **Answer:** We define CSS variables (e.g. `--accent-color`, `--bg-gradient`) under the root selector. In our shared `style.css` file, we re-declare these variables under class selectors `body.user-page` and `body.admin-page`. By toggling body classes, the browser updates styles across the page instantly without duplicating stylesheets.

### 5. Why use Semantic HTML tags like `<main>` or `<section>` over `<div>`?
> **Answer:** Semantic HTML improves search engine optimization (SEO), makes code cleaner to read for developers, and ensures accessibility (e.g. screen readers can easily parse headers, side forms, and navigational areas).
