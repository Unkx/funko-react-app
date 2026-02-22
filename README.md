# funko-react-app

Funko React App
A full-stack collectible catalog and social platform for Funko Pop enthusiasts. Browse collections, manage wishlists, connect with other collectors, and track your loyalty rewards — all in one place.

# Features
The app lets you browse and search through Funko Pop items, save things to a wishlist, and register/login with a full auth system. There's an admin panel for managing users, a loyalty program with badges and a leaderboard, a chat component, map visualizations, and an analytics dashboard. Users can also submit requests for missing items.

# Tech Stack
The frontend is built with React, TypeScript, Vite and Tailwind CSS. The backend runs on Node.js with a PostgreSQL database (init scripts are in the backend/ folder). Testing is handled by Cypress for E2E and Vitest for unit tests. The whole thing can be run in Docker via Docker Compose.

# Project Structure
├── src/              # React components and routes
├── backend/          # Node server, init-db.js, DB helpers
├── cypress/          # E2E and component tests
├── docs/             # Architecture notes and diagrams
├── docker-compose.yml
└── Dockerfile

# Getting Started
The easiest way to run the project is with Docker:
bashdocker-compose up --build
If you prefer running it locally without Docker, install dependencies first, then start the backend and frontend separately:
bashnpm install

# In one terminal
cd backend && node server.js

# In another terminal
npm run dev

# Tests
bash# Unit tests
npm run test

# E2E tests
npm run cypress:open

# Environment
The project expects a .env file in the root directory (not committed to git). Check EMAIL_CONFIGURATION.md and PASSWORD_RESET_FEATURE.md for details on specific environment variables related to email and password reset functionality.

# Docs
Architecture diagrams and additional setup notes can be found in the docs/ and diagrams/ folders.


# Disclaimer : Funko Pop is a registered trademark of Funko, LLC. This project is unofficial and not affiliated with Funko.
