# 🤝 JoinMe - Social Utility Platform

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue?style=flat-square&logo=mongodb)
![Socket.io](https://img.shields.io/badge/RealTime-Socket.io-black?style=flat-square&logo=socket.io)
![Stripe](https://img.shields.io/badge/Payments-Stripe-indigo?style=flat-square&logo=stripe)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss)

**JoinMe** is a full-stack, real-time hyper-local event platform designed to seamlessly connect individuals for spontaneous activities like turf cricket, road trips, and movie outings. It bridges the gap between digital planning and real-world meetups with a robust architecture handling secure financial transactions, live state synchronization, and intelligent role-based access control.

---

## ✨ Engineering Highlights

This project was built with a focus on system design, performance optimization, and enterprise-grade feature implementation:

* **Secure Payment Pipeline (Stripe):** Integrated Stripe Checkout for paid events. Implemented asynchronous session verification to securely update database transaction states, auto-enrolling users upon successful payment while handling edge cases like hard-refresh state wiping.
* **Dual-Layer Notification System:** Engineered a real-time alerting system using **Socket.io** combined with persisted MongoDB records. Ensures instant delivery for online users via localized socket rooms, with fallback database fetching for offline users.
* **Synchronous State Hydration:** Solved complex React Context race conditions using an optimized `localStorage` + `HttpOnly` Cookie pipeline. This ensures a seamless UX during hard reloads without flashing unauthorized states.
* **Dynamic Resource Allocation:** The platform intelligently segregates active vs. historical events, recalculating live capacities in `O(1)` time to prevent database over-booking or concurrency issues.

---

## 🚀 Core Features

### For Users (Guests)
* **Explore Hub:** Filter active local events by Category, Date, and City.
* **Instant Join & Payments:** Securely pay entry fees via Stripe for instant approval, or send free requests to pending host queues.
* **Trust & Safety:** Rate and review hosts after an event is marked completed.
* **Real-Time Feed:** Watch live event counts update instantly across the city without refreshing the page.

### For Organizers (Hosts)
* **Host Dashboard:** Centralized command center to approve/reject pending requests.
* **Event Lifecycle Management:** Post free or paid events, manage attendee capacities, and close events.
* **Live Event Chat:** Integrated real-time messaging specific to approved attendees of an event.

---

## 🛠️ Tech Stack

**Frontend (Client)**
* React.js (Vite)
* Tailwind CSS & Lucide React (UI/UX)
* React Router DOM (Protected Routing)
* Context API (Global State Management)

**Backend (Server)**
* Node.js & Express.js
* MongoDB & Mongoose (Schema Validation & Aggregation)
* Socket.io (Bi-directional Real-Time Communication)
* JSON Web Tokens (JWT) & bcrypt (Authentication)
* Stripe Node SDK (Payment Gateway)

---

## 💻 Getting Started

### Prerequisites
Make sure you have Node.js and MongoDB installed on your local machine. You will also need a free Stripe Developer account for test API keys.

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/JoinMe.git](https://github.com/yourusername/JoinMe.git)
cd JoinMe
