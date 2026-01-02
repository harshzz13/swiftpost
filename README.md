# SwiftPost

A modern queue management system for service centers. Customers book tokens, track their position in real-time, and get served efficiently at service counters.

## Features

- **Token Booking** - Customers select a service type and receive a unique token (e.g., P-001 for Parcel Drop-off)
- **Queue Tracking** - Real-time position updates and estimated wait times
- **Staff Interface** - Call next customer, serve tokens, mark as complete
- **Admin Dashboard** - Manage counters, view statistics, monitor queue health
- **Multi-Service Support** - Parcel Drop-off, Banking Services, General Inquiry, Document Verification

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS, Material-UI |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Prisma ORM |
| Real-time | Socket.IO (backend ready, frontend disabled*) |
| Testing | Jest, fast-check (property-based testing) |

*See [Socket.IO Status](#socketio-status) section below.

## Project Structure

```
swiftpost/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── index.ts           # Server entry point
│   │   ├── routes/            # API endpoints (tokens, counters, stats)
│   │   ├── services/          # Business logic
│   │   │   ├── QueueManager.ts
│   │   │   ├── CounterService.ts
│   │   │   ├── StatisticsService.ts
│   │   │   └── RealTimeEventManager.ts
│   │   ├── middleware/        # Error handling, validation
│   │   ├── lib/               # Utilities (Prisma client, socket)
│   │   └── types/             # TypeScript interfaces
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── migrations/        # Database migrations
│   │   └── seed.ts            # Sample data seeder
│   └── tests/                 # Unit, integration, property tests
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── pages/             # Home, BookToken, TokenStatus, Staff, Admin
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   └── lib/               # API client, utilities
│   └── public/                # Static assets
└── package.json               # Workspace configuration
```

## Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL database (local or cloud)
- npm

### 1. Clone and Install

```bash
git clone <repository-url>
cd swiftpost
npm run install:all
```

### 2. Configure Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your database credentials:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/swiftpost_db"
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Configure Frontend

```bash
cp frontend/.env.example frontend/.env
```

Default values work for local development:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### 4. Setup Database

```bash
cd backend
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:seed        # (Optional) Seed sample data
cd ..
```

### 5. Start Development

```bash
npm run dev
```

This starts both servers:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

## Available Scripts

### Root Level
| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend |
| `npm run build` | Build both for production |
| `npm run test` | Run backend tests |
| `npm run install:all` | Install all dependencies |

### Backend (`npm run backend:*`)
| Command | Description |
|---------|-------------|
| `backend:dev` | Start development server |
| `backend:build` | Compile TypeScript |
| `backend:test` | Run Jest tests |

### Frontend (`npm run frontend:*`)
| Command | Description |
|---------|-------------|
| `frontend:dev` | Start Vite dev server |
| `frontend:build` | Build for production |

### Database (run from `backend/`)
| Command | Description |
|---------|-------------|
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run prisma:migrate` | Run pending migrations |
| `npm run prisma:reset` | Reset database (destructive) |
| `npm run prisma:seed` | Seed sample data |

## API Reference

Base URL: `http://localhost:3000/api`

### Tokens

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/tokens` | Generate new token |
| `GET` | `/tokens/:tokenNumber` | Get token status |
| `GET` | `/tokens` | List all tokens (with filters) |
| `POST` | `/tokens/call-next` | Call next waiting token |
| `PUT` | `/tokens/:tokenNumber/complete` | Mark token as completed |

### Counters

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/counters` | List all counters |
| `POST` | `/counters` | Create new counter |
| `PUT` | `/counters/:id/activate` | Activate counter |
| `PUT` | `/counters/:id/deactivate` | Deactivate counter |
| `DELETE` | `/counters/:id` | Delete counter |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/stats` | Get queue statistics |
| `GET` | `/stats/daily` | Get daily statistics |

### Example: Generate Token

```bash
curl -X POST http://localhost:3000/api/tokens \
  -H "Content-Type: application/json" \
  -d '{"serviceType": "Parcel Drop-off"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": {
      "tokenNumber": "P-001",
      "serviceType": "Parcel Drop-off",
      "status": "WAITING"
    },
    "queuePosition": 1,
    "estimatedWaitTime": 5
  }
}
```

## Socket.IO Status

### Current Implementation

| Component | Status | Notes |
|-----------|--------|-------|
| Backend Server | ✅ Working | Emits events on all token/counter changes |
| RealTimeEventManager | ✅ Working | Broadcasts to connected clients |
| Frontend Hook | ⚠️ Disabled | All methods are no-ops |

### Why Frontend is Disabled

The frontend Socket.IO hook (`frontend/src/hooks/useSocket.ts`) was intentionally disabled to prevent WebSocket connection spam during development. The backend continues to emit events, but the frontend doesn't receive them.

### Events Emitted by Backend

```typescript
// Token events
'tokenGenerated'    // New token created
'tokenCalled'       // Token assigned to counter
'tokenCompleted'    // Token service completed
'token-called'      // Notification for specific token
'your-token-called' // Targeted notification

// Queue events
'queue-updated'     // Position changes

// Counter events
'counterAdded'      // New counter created
'counterDeleted'    // Counter removed
'counter-status-changed' // Activation/deactivation

// Statistics
'statistics-updated' // Dashboard stats refresh
```

### Enabling Socket.IO in Production

To enable real-time updates, restore the `useSocket.ts` hook:

```typescript
// frontend/src/hooks/useSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback);
  };

  const emit = (event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  };

  return { on, off, emit, isConnected };
}
```

## Service Types

| Code | Service Type |
|------|--------------|
| P | Parcel Drop-off |
| B | Banking Services |
| G | General Inquiry |
| D | Document Verification |

Token format: `[Service_Letter]-[Sequential_Number]` (e.g., P-001, B-042)

## Database Schema

```prisma
model Token {
  id            Int         @id @default(autoincrement())
  tokenNumber   String      @unique
  serviceType   String
  status        TokenStatus @default(WAITING)
  counterId     Int?
  createdAt     DateTime    @default(now())
  calledAt      DateTime?
  completedAt   DateTime?
  counter       Counter?    @relation(fields: [counterId], references: [id])
}

model Counter {
  id        Int           @id @default(autoincrement())
  number    Int           @unique
  status    CounterStatus @default(ACTIVE)
  createdAt DateTime      @default(now())
  tokens    Token[]
}

enum TokenStatus {
  WAITING
  SERVING
  COMPLETED
}

enum CounterStatus {
  ACTIVE
  INACTIVE
}
```

## Testing

```bash
# Run all backend tests
npm run backend:test

# Run with coverage
cd backend && npm run test:coverage

# Run in watch mode
cd backend && npm run test:watch
```

Tests include:
- Unit tests for services
- Integration tests for API endpoints
- Property-based tests using fast-check

## Production Deployment

### Build

```bash
npm run build
```

Outputs:
- `backend/dist/` - Compiled Node.js server
- `frontend/dist/` - Static files for CDN/web server

### Environment Variables (Production)

Backend:
```env
DATABASE_URL="postgresql://..."
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
SOCKET_IO_CORS_ORIGIN=https://your-frontend-domain.com
```

Frontend:
```env
VITE_API_URL=https://your-api-domain.com/api
VITE_SOCKET_URL=https://your-api-domain.com
```

## Troubleshooting

### "Cannot delete counter" (400 error)
This is expected behavior. Counters with active tokens (SERVING status) cannot be deleted or deactivated. Complete the token first.

### Database connection errors
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `backend/.env`
3. Run `npm run prisma:generate` after schema changes

### Frontend not updating
The app uses polling (manual refresh) since Socket.IO is disabled. Click refresh buttons or reload the page to see updates.

## License

MIT
