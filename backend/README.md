# SwiftPost Backend

Queue management system backend for SwiftPost service centers.

## Features

- Token generation and queue management
- Real-time updates via WebSocket
- Counter management
- Statistics and analytics
- RESTful API endpoints

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO
- **Testing**: Jest with fast-check for property-based testing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Set up the database:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API Base
- `GET /api` - API information

## Environment Variables

See `.env.example` for required environment variables.

## Testing

The project uses a dual testing approach:
- **Unit Tests**: Jest for specific examples and edge cases
- **Property Tests**: fast-check for universal properties

Run tests with:
```bash
npm test
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Main server file
│   ├── lib/
│   │   └── database.ts       # Database connection
│   ├── middleware/
│   │   ├── errorHandler.ts   # Error handling middleware
│   │   └── notFoundHandler.ts # 404 handler
│   └── types/
│       └── index.ts          # TypeScript type definitions
├── tests/
│   ├── setup.ts              # Test configuration
│   ├── unit/                 # Unit tests
│   └── properties/           # Property-based tests
├── prisma/
│   └── schema.prisma         # Database schema
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── jest.config.js            # Test configuration
```