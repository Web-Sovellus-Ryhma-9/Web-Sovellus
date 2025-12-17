# Movie Review Application

A full-stack web application for browsing movies, writing reviews, and managing favorite movies with group functionality. The application is containerized using Docker with three main services:

- **Backend API**: Node.js/Express REST API with JWT authentication
- **Frontend**: React application
- **Database**: PostgreSQL 16

## Features

- User authentication (registration, login, logout)
- Movie browsing with TMDB integration
- User reviews and ratings
- Favorite movies management
- Group functionality for sharing favorites
- Account management

## Technologies

- **Backend**: Node.js, Express.js, PostgreSQL, JWT, bcryptjs
- **Frontend**: React
- **Containerization**: Docker, Docker Compose
- **Testing**: Jest

## Running the Application

Start the application with Docker Compose:

```bash
docker compose up --build
```

## Testing

Unit tests are located in the `api/src/controllers/__tests__/` directory:

- [api/src/controllers/__tests__/account_controller.test.js](api/src/controllers/__tests__/account_controller.test.js) - Tests for authentication and account management
- [api/src/controllers/__tests__/review_controller.test.js](api/src/controllers/__tests__/review_controller.test.js) - Tests for review functionality

Run tests with:

```bash
cd api
npm test
```