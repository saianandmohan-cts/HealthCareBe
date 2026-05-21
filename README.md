# 🏥 HealthCareBe - Advanced Role-Based Healthcare Backend

Welcome to the backend engine of **1C Hospital** Management Portal. This server is built using **Node.js**, **Express**, and **MongoDB (Mongoose)**, utilizing an advanced, modern **HttpOnly Cookie Authentication Architecture** with role-based restrictions (`PATIENT` & `DOCTOR`).

It eliminates the security loopholes of LocalStorage (like XSS vulnerabilities) and implements a highly decentralized, modular structure separating route definitions, business controller logic, and strict middleware security checkpoints.

---

## 🚀 Key Architectural Features

* 🔒 **Pure HttpOnly Cookie Session Management**: Tokens are dropped and destroyed natively by the browser using secure options, completely isolated from malicious frontend client scripts.
* 🧠 **Dynamic Session Restoration (`/login/me`)**: A smart centralized endpoint that dynamically identifies token claims, resolves user identity, and updates front-end client states.
* 🚦 **Symmetric Guard Middlewares**: Custom security walls (`verifyPatient`, `verifyDoctor`) protecting sensitive operational medical routes.
* 📅 **Algorithmic Appointment Lifecycle Filter**: Precise real-time logical grouping for Upcoming Schedulings versus Historical and Past Consultations using localized date configurations.
* 💎 **Modular Security Utils**: Single source of truth for token generations, automatic cookie builders, and global error handling pipes.

---

## 🛠️ Tech Stack & Dependencies

* **Runtime Environment:** Node.js v20+ / v25+
* **Framework:** Express.js (REST API Architecture)
* **Database ORM:** Mongoose / MongoDB Atlas
* **Security & Encryption:** JsonWebToken (JWT), Bcrypt (10 Salt Rounds)
* **Session Management:** Cookie-Parser

---

## 📂 Project Architecture Mapping

```text
├── src/
│   ├── config/             # Database connection setups
│   ├── controllers/
│   │   ├── authController.js   # Client registration, logging streams, dynamic session sync
│   │   └── doctorController.js # Doctor dashboard aggregations & appointment triggers
│   ├── middleware/
│   │   └── auth.js             # High-level guards, cookie builders & token signers
│   ├── models/
│   │   ├── patient.js          # Patient schema (IDs, histories, records, hashes)
│   │   ├── doctor.js           # Doctor schema (departments, specs, relational map arrays)
│   │   └── appointment.js      # Core transaction appointments (Timestamps, stats)
│   └── routes/
│       ├── authRoutes.js       # Mapping entry gates for authorization
│       └── doctorRoutes.js     # Protected workflow pipelines for dashboards
├── .env.example            # Reference configurations (JWT_SECRET, MONGO_URI)
└── server.js               # Primary server bootstrap entry file
