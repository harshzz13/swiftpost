# Requirements Document

## Introduction

SwiftPost Backend is the core business logic layer for a queue management system that handles token generation, queue management, and real-time updates for service centers. The backend serves as the intelligent brain that manages all queue operations, calculates waiting times, and coordinates between multiple service counters.

## Glossary

- **Token**: A unique identifier assigned to customers for queue management
- **Queue_Manager**: The core system component that manages token ordering and assignments
- **Counter**: A service point where staff serve customers
- **Service_Type**: Categories of services offered (Parcel Drop-off, Banking, General Inquiry, Document Verification)
- **Token_Status**: Current state of a token (Waiting, Serving, Completed)
- **Backend_API**: RESTful API endpoints for frontend communication
- **Real_Time_Service**: WebSocket service for live updates
- **Database_Layer**: Persistent storage for tokens, counters, and statistics

## Requirements

### Requirement 1: Token Generation and Management

**User Story:** As a customer, I want to receive a unique token number when I book a service, so that I can join the queue and track my position.

#### Acceptance Criteria

1. WHEN a customer requests a token for a service, THE Queue_Manager SHALL generate a unique token number following the format [Service_Letter]-[Sequential_Number]
2. WHEN a token is generated, THE Queue_Manager SHALL assign it a "Waiting" status and store it in the database
3. WHEN a token is created, THE Queue_Manager SHALL calculate and return the current queue position and estimated waiting time
4. THE Queue_Manager SHALL ensure token numbers are sequential within each service type
5. WHEN multiple customers request tokens simultaneously, THE Queue_Manager SHALL handle concurrent requests without duplicate numbers

### Requirement 2: Queue Management and Ordering

**User Story:** As a staff member, I want to call the next customer in line, so that I can serve customers in the correct order.

#### Acceptance Criteria

1. WHEN staff requests the next token, THE Queue_Manager SHALL return the earliest waiting token for any service type
2. WHEN a token is assigned to a counter, THE Queue_Manager SHALL update its status to "Serving" and record the counter assignment
3. WHEN a token is marked as completed, THE Queue_Manager SHALL update its status to "Completed" and free the counter
4. THE Queue_Manager SHALL maintain queue order based on token creation timestamp
5. WHEN no tokens are waiting, THE Queue_Manager SHALL return an appropriate empty queue response

### Requirement 3: Real-Time Updates and Notifications

**User Story:** As a customer, I want to receive live updates about my queue position and waiting time, so that I know when to return for service.

#### Acceptance Criteria

1. WHEN a token status changes, THE Real_Time_Service SHALL broadcast updates to all connected clients
2. WHEN queue positions change, THE Real_Time_Service SHALL send updated waiting times to affected customers
3. WHEN a customer's token is called, THE Real_Time_Service SHALL send a notification to that specific customer
4. THE Real_Time_Service SHALL maintain persistent connections with frontend clients
5. WHEN connection is lost, THE Real_Time_Service SHALL handle reconnection gracefully

### Requirement 4: Counter Management

**User Story:** As an administrator, I want to manage service counters, so that I can control how many staff members are serving customers.

#### Acceptance Criteria

1. WHEN an administrator adds a counter, THE Queue_Manager SHALL register it as available for token assignment
2. WHEN an administrator deactivates a counter, THE Queue_Manager SHALL prevent new token assignments to that counter
3. WHEN a counter becomes available, THE Queue_Manager SHALL automatically assign the next waiting token if any exist
4. THE Queue_Manager SHALL track which counter is serving which token
5. WHEN a counter is serving a token, THE Queue_Manager SHALL mark that counter as busy

### Requirement 5: Statistics and Analytics

**User Story:** As an administrator, I want to view queue statistics and performance metrics, so that I can monitor system efficiency and make operational decisions.

#### Acceptance Criteria

1. WHEN an administrator requests daily statistics, THE Backend_API SHALL return total tokens issued, completed, and currently waiting
2. WHEN calculating average waiting time, THE Queue_Manager SHALL compute the mean time between token creation and service completion
3. WHEN displaying counter utilization, THE Backend_API SHALL show active/inactive counter counts and their current status
4. THE Backend_API SHALL provide real-time queue length and current serving tokens
5. WHEN generating reports, THE Backend_API SHALL include time-based metrics for performance analysis

### Requirement 6: Token Status Tracking

**User Story:** As a customer, I want to check my token status using my token number, so that I can see my current position and estimated waiting time.

#### Acceptance Criteria

1. WHEN a customer provides a token number, THE Backend_API SHALL return the current status, queue position, and estimated waiting time
2. WHEN a token doesn't exist, THE Backend_API SHALL return an appropriate error message
3. WHEN calculating queue position, THE Queue_Manager SHALL count only tokens with "Waiting" status that were created before the queried token
4. WHEN estimating waiting time, THE Queue_Manager SHALL use average service time and current queue position
5. THE Backend_API SHALL validate token number format before processing requests

### Requirement 7: Data Persistence and Recovery

**User Story:** As a system administrator, I want all queue data to be persistently stored, so that the system can recover from failures without losing customer information.

#### Acceptance Criteria

1. WHEN a token is created, THE Database_Layer SHALL immediately persist it with all relevant information
2. WHEN token status changes, THE Database_Layer SHALL update the record with timestamp information
3. WHEN the system restarts, THE Queue_Manager SHALL restore queue state from the database
4. THE Database_Layer SHALL store counter information and their current assignments
5. WHEN data corruption is detected, THE Database_Layer SHALL provide error logging and recovery mechanisms

### Requirement 8: API Integration and Communication

**User Story:** As a frontend developer, I want well-defined API endpoints, so that I can integrate the user interfaces with the backend system.

#### Acceptance Criteria

1. WHEN frontend requests token generation, THE Backend_API SHALL provide a POST endpoint that accepts service type and returns token details
2. WHEN staff needs to call next token, THE Backend_API SHALL provide a PUT endpoint that assigns tokens to counters
3. WHEN checking token status, THE Backend_API SHALL provide a GET endpoint that accepts token number and returns current information
4. THE Backend_API SHALL return consistent JSON responses with appropriate HTTP status codes
5. WHEN API errors occur, THE Backend_API SHALL provide descriptive error messages and proper error codes