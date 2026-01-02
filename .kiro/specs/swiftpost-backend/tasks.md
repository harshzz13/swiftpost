# Implementation Plan: SwiftPost Backend

## Overview

This implementation plan breaks down the SwiftPost backend development into discrete, manageable tasks that build incrementally. Each task focuses on implementing specific components while maintaining integration with previously completed work. The plan emphasizes early validation through testing and includes checkpoints to ensure system stability.

## Tasks

- [-] 1. Project Setup and Core Infrastructure
  - Initialize Node.js project with TypeScript configuration
  - Set up Express.js server with basic middleware (CORS, JSON parsing, error handling)
  - Configure PostgreSQL database connection and Prisma ORM
  - Set up testing framework (Jest) and property-based testing (fast-check)
  - Create basic project structure and environment configuration
  - _Requirements: 7.1, 8.4_

- [ ]* 1.1 Write property test for project setup
  - **Property 8: Data Persistence Round-trip**
  - **Validates: Requirements 7.1**

- [ ] 2. Database Schema and Models
  - [ ] 2.1 Create Prisma schema for Token and Counter models
    - Define Token model with all required fields (tokenNumber, serviceType, status, etc.)
    - Define Counter model with status tracking
    - Set up proper relationships between models
    - _Requirements: 7.1, 7.4_

  - [ ] 2.2 Generate and run database migrations
    - Generate Prisma client and migration files
    - Apply initial database schema
    - _Requirements: 7.1_

  - [ ]* 2.3 Write property tests for data models
    - **Property 8: Data Persistence Round-trip**
    - **Validates: Requirements 7.1, 7.2, 7.4**

- [ ] 3. Core Queue Manager Service
  - [ ] 3.1 Implement token generation logic
    - Create QueueManager class with generateToken method
    - Implement service letter mapping (A=Parcel, B=Banking, etc.)
    - Add sequential number generation within service types
    - Handle concurrent token generation with database transactions
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [ ]* 3.2 Write property test for token generation
    - **Property 1: Token Generation Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.4, 1.5**

  - [ ] 3.3 Implement queue management methods
    - Add getNextToken method for retrieving earliest waiting token
    - Implement assignTokenToCounter for token assignment
    - Add completeToken method for marking tokens as completed
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 3.4 Write property test for queue operations
    - **Property 2: Queue Ordering Invariant**
    - **Property 3: Token State Transition Correctness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 4.4, 4.5, 6.3**

- [ ] 4. Queue Position and Wait Time Calculations
  - [ ] 4.1 Implement queue position calculation
    - Add calculateQueuePosition method
    - Count only waiting tokens created before the queried token
    - _Requirements: 6.3_

  - [ ] 4.2 Implement wait time estimation
    - Add estimateWaitTime method using average service time
    - Calculate based on queue position and historical data
    - _Requirements: 1.3, 6.4_

  - [ ]* 4.3 Write property test for calculations
    - **Property 9: Wait Time Estimation Consistency**
    - **Validates: Requirements 1.3, 6.4**

- [ ] 5. Checkpoint - Core Queue Logic Complete
  - Ensure all queue management tests pass
  - Verify token generation, assignment, and completion work correctly
  - Ask the user if questions arise

- [ ] 6. Counter Management Service
  - [ ] 6.1 Implement Counter service class
    - Create CounterService with addCounter, activateCounter, deactivateCounter methods
    - Add getAvailableCounters and assignCounter methods
    - Implement automatic token assignment when counters become available
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 6.2 Write property test for counter management
    - **Property 5: Counter Management Correctness**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 7. Statistics Service
  - [ ] 7.1 Implement statistics calculation methods
    - Create StatisticsService class
    - Add methods for daily token counts, queue length, average wait time
    - Implement counter utilization calculations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 7.2 Write property test for statistics
    - **Property 6: Statistics Calculation Accuracy**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [ ] 8. REST API Endpoints
  - [ ] 8.1 Implement token-related API endpoints
    - POST /api/tokens - Generate new token
    - GET /api/tokens/:tokenNumber - Get token status
    - PUT /api/tokens/next - Assign next token to counter
    - PUT /api/tokens/:tokenNumber/complete - Mark token as completed
    - Add proper input validation and error handling
    - _Requirements: 6.1, 6.2, 6.5, 8.1, 8.2, 8.3_

  - [ ] 8.2 Implement counter and statistics API endpoints
    - GET /api/counters - Get counter status
    - POST /api/counters - Add new counter
    - PUT /api/counters/:id/status - Update counter status
    - GET /api/statistics - Get queue statistics
    - _Requirements: 4.1, 5.1_

  - [ ]* 8.3 Write property test for API responses
    - **Property 7: API Response Consistency**
    - **Validates: Requirements 6.1, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ]* 8.4 Write unit tests for API endpoints
  - Test specific examples and error conditions
  - Test input validation and error responses
  - _Requirements: 6.2, 8.5_

- [ ] 9. Checkpoint - API Layer Complete
  - Ensure all API endpoints work correctly
  - Verify proper error handling and response formats
  - Test integration between API and business logic
  - Ask the user if questions arise

- [ ] 10. Real-time WebSocket Service
  - [ ] 10.1 Set up Socket.IO server
    - Configure Socket.IO with Express server
    - Set up connection handling and room management
    - Implement basic event structure
    - _Requirements: 3.4_

  - [ ] 10.2 Implement real-time event broadcasting
    - Create RealTimeEventManager class
    - Add methods for broadcasting queue updates, token calls, statistics
    - Implement targeted notifications for specific customers
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 10.3 Write property test for real-time updates
    - **Property 4: Real-time Notification Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 11. Integration and Event Coordination
  - [ ] 11.1 Wire real-time events with business logic
    - Integrate RealTimeEventManager with QueueManager
    - Add event triggers for token status changes
    - Implement queue position update broadcasts
    - _Requirements: 3.1, 3.2_

  - [ ] 11.2 Add automatic counter assignment logic
    - Integrate counter availability with queue management
    - Implement automatic assignment when counters become free
    - _Requirements: 4.3_

  - [ ]* 11.3 Write integration tests
    - Test end-to-end flows from API to real-time updates
    - Test automatic counter assignment scenarios
    - _Requirements: 2.1, 3.1, 4.3_

- [ ] 12. Error Handling and Resilience
  - [ ] 12.1 Implement comprehensive error handling
    - Add try-catch blocks and proper error logging
    - Implement database transaction rollbacks
    - Add input validation and sanitization
    - _Requirements: 8.5_

  - [ ] 12.2 Add connection resilience
    - Implement database connection pooling and retry logic
    - Add WebSocket reconnection handling
    - _Requirements: 3.5_

  - [ ]* 12.3 Write unit tests for error scenarios
    - Test database failures, invalid inputs, network errors
    - Test error response formats and status codes
    - _Requirements: 6.2, 8.5_

- [ ] 13. Final Integration and Testing
  - [ ] 13.1 Complete system integration
    - Wire all components together
    - Ensure proper startup and shutdown procedures
    - Add environment-based configuration
    - _Requirements: All_

  - [ ]* 13.2 Write comprehensive integration tests
    - Test complete user workflows (customer, staff, admin)
    - Test concurrent operations and edge cases
    - _Requirements: All_

- [ ] 14. Final Checkpoint - System Complete
  - Run all tests (unit, property, integration)
  - Verify all requirements are implemented
  - Test system with sample data
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and system stability
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases using Jest
- Integration tests verify component interactions and end-to-end flows