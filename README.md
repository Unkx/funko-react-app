# Funko Pop Collector's Hub

https://snipboard.io/F6VtSk.jpg
https://snipboard.io/okCyTO.jpg
https://snipboard.io/C1W0bN.jpg
https://snipboard.io/seIMBL.jpg
https://snipboard.io/aryOit.jpg

A full-stack social platform for Funko Pop collectors. Browse collections, manage wishlists, connect with other collectors, and earn loyalty rewards — all in one place.

🚀 [View Live Demo](https://funko-react-app.onrender.com) | [🐛 Report Bug](../../issues/new?labels=bug) | [✨ Request Feature](../../issues/new?labels=enhancement)

https://snipboard.io/6AHur9.jpg


✨ Features at a Glance
👤 For Collectors
Browse & Search – Explore the complete Funko Pop catalog with advanced filtering

Personal Wishlists – Save and manage items you want to collect

Real-time Chat – Connect and discuss with other collectors

Loyalty Program – Earn badges and climb the leaderboard through engagement

Request System – Submit requests for missing items

🛠️ For Administrators
Admin Dashboard – Full user management and moderation tools

Analytics Panel – Track platform metrics and user engagement

Request Queue – Review and process item requests

🗺️ Interactive Features
Map Visualizations – See collector distribution worldwide

QuickLinks – Fast navigation to popular sections

Responsive Design – Perfect experience on desktop and mobile

🏗️ Architecture & Tech Stack
Frontend
React 18 with TypeScript – Type-safe, component-based UI

Vite – Lightning-fast builds and hot reload

Tailwind CSS – Utility-first styling for consistent design

Context API – State management for user sessions and themes

Backend
Node.js with Express – RESTful API architecture

PostgreSQL – Relational database with complex queries

JWT Authentication – Secure, token-based auth system

Nodemailer – Password reset and email notifications

DevOps & Tooling
Docker & Docker Compose – Containerized development and deployment

Render – Live hosting with managed PostgreSQL database

Cypress – End-to-end and component testing

Vitest – Unit testing for robust code

Git – Version control with 139+ commits showing project evolution

Project Structure
text
📦 funko-react-app
├── 📁 src              # React components, pages, and hooks
├── 📁 backend          # Node.js server, database helpers, init scripts
├── 📁 cypress          # E2E and component tests
├── 📁 docs             # Architecture diagrams and documentation
├── 📁 diagrams         # Visual system design
├── 🐳 docker-compose.yml
└── 🐳 Dockerfile
🚀 Key Challenges & Solutions
This project pushed me beyond tutorials. Here's how I solved some complex problems:

1. Real-time Chat & Loyalty System
Challenge: Syncing real-time messages with a gamified loyalty system that awards badges based on activity.
Solution: Implemented WebSocket connections for instant messaging while using PostgreSQL triggers to update user activity metrics. The loyalty program calculates scores based on chat messages, wishlist additions, and login streaks—all updating the leaderboard in real-time.

2. Complex Database Relationships
Challenge: Modeling the many-to-many relationships between users, wishlists, items, and loyalty badges efficiently.
Solution: Designed a normalized PostgreSQL schema with junction tables and composite indexes. Used transaction queries to ensure data integrity when users add items or earn badges.

3. Full Test Coverage
Challenge: Ensuring reliability across authentication flows, API routes, and critical user journeys.
Solution: Wrote comprehensive Cypress tests covering user registration, login, password reset, and wishlist management. Unit tests with Vitest validate individual component behavior.

4. Production-Ready Deployment
Challenge: Deploying a full-stack app with environment-specific configurations.
Solution: Containerized the entire application with Docker, separating frontend, backend, and database services. Deployed on Render with automated SSL, environment variable management, and a managed PostgreSQL instance.

🏁 Getting Started
Option A: Docker (Recommended)
bash
# Clone the repository
git clone https://github.com/Unkx/funko-react-app.git
cd funko-react-app

# Build and run with Docker Compose
docker-compose up --build

# App will be available at http://localhost:3000
Option B: Local Development
bash
# Install dependencies
npm install

# Terminal 1: Start the backend
cd backend && node server.js

# Terminal 2: Start the frontend dev server
npm run dev
Environment Setup
Create a .env file in the root directory with:

env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=funko_db

# Authentication
JWT_SECRET=your_jwt_secret

# Email (for password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
📚 See EMAIL_CONFIGURATION.md and PASSWORD_RESET_FEATURE.md for detailed setup.

🧪 Testing
bash
# Run unit tests
npm run test

# Open Cypress test runner
npm run cypress:open

# Run E2E tests headlessly
npm run cypress:run
📊 What This Project Demonstrates
✅ Full-stack development – React + Node.js + PostgreSQL
✅ Authentication & security – JWT, password hashing, protected routes
✅ Real-time features – WebSocket chat
✅ Database design – Complex relationships, indexes, transactions
✅ Testing – E2E (Cypress) + Unit (Vitest)
✅ DevOps – Docker, cloud deployment (Render), CI/CD ready
✅ Code quality – TypeScript, ESLint, consistent commits
✅ Project management – 139+ commits showing iterative development

📚 Documentation
Architecture Diagrams – Visual system design

API Documentation – Endpoint reference

Database Schema – Table relationships

Deployment Guide – Production setup

🤝 Contributing
Contributions are welcome! Feel free to:

Fork the repository

Create a feature branch (git checkout -b feature/AmazingFeature)

Commit changes (git commit -m 'Add AmazingFeature')

Push to branch (git push origin feature/AmazingFeature)

Open a Pull Request

⚠️ Disclaimer
Funko Pop is a registered trademark of Funko, LLC. This project is unofficial, not affiliated with Funko, and created for educational and portfolio purposes only.

📫 Contact & Connect
Your Name – [Your LinkedIn URL] – [Your Email]

Project Link: https://github.com/Unkx/funko-react-app
Live Demo: https://funko-react-app.onrender.com

If you find this project helpful or interesting, please ⭐ star it on GitHub!

