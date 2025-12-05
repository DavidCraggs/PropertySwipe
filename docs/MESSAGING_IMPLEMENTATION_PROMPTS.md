# Parallelized Implementation Prompts for Messaging System

## Overview
These prompts can be executed in parallel by AI agents to implement the dual-conversation messaging system. Each prompt is designed to be independent and can be worked on concurrently.

---

## Prompt 1: Database Schema & Migration
**Priority:** High | **Dependencies:** None | **Estimated Time:** 30-45 min

### Task
Design and implement the database schema changes to support separate landlord and agency conversation threads.

### Requirements
1. Analyze the current `matches` table schema and the existing `messages` jsonb array structure
2. Create a new `conversations` table with the following structure:
   - `id` (uuid, primary key)
   - `match_id` (uuid, foreign key to matches)
   - `conversation_type` (text: 'landlord' | 'agency')
   - `messages` (jsonb array)
   - `unread_count_renter` (integer)
   - `unread_count_other` (integer)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)
3. Create appropriate indexes for query performance (match_id, conversation_type)
4. Write a migration script that:
   - Creates the new table
   - Migrates existing messages from `matches.messages` to the new `conversations` table (as 'landlord' type by default)
   - Handles rollback scenarios
5. Add RLS (Row Level Security) policies appropriate for the PropertySwipe security model
6. Create SQL functions for common operations (get_conversation, mark_as_read, etc.)

### Deliverables
- Migration SQL file in `supabase/migrations/`
- Documentation of the schema design decisions
- Test queries to validate the migration

---

## Prompt 2: TypeScript Types & Interfaces
**Priority:** High | **Dependencies:** None | **Estimated Time:** 20-30 min

### Task
Define TypeScript types and interfaces for the dual-conversation messaging system.

### Requirements
1. Locate and review existing message-related types in `src/types/index.ts` or similar
2. Create/update the following types:
   - `ConversationType`: 'landlord' | 'agency'
   - `Conversation`: Interface matching the database schema
   - `Message`: Ensure it's compatible with the new structure
   - `ConversationMetadata`: Unread counts, last message info, etc.
   - `SendMessageParams`: Include conversation_type parameter
3. Update the `Match` type to reflect the new conversation structure
4. Create type guards for conversation type checking
5. Add JSDoc comments explaining the purpose of each type

### Deliverables
- Updated type definitions in appropriate files
- Type guard functions
- Documentation of type usage patterns

---

## Prompt 3: Storage Service Layer
**Priority:** High | **Dependencies:** Prompts 1 & 2 | **Estimated Time:** 45-60 min

### Task
Implement the storage service functions for managing dual conversations.

### Requirements
1. Review the existing `src/lib/storage.ts` or equivalent service file
2. Implement the following functions:
   - `getConversations(matchId: string)`: Fetch both conversations for a match
   - `getConversation(matchId: string, type: ConversationType)`: Fetch specific conversation
   - `sendMessage(matchId: string, type: ConversationType, message: Message)`: Send message to specific thread
   - `markConversationAsRead(conversationId: string, userRole: string)`: Update unread counts
   - `getUnreadCounts(matchId: string)`: Get unread counts for both conversations
3. Ensure proper error handling and validation
4. Add optimistic updates support for real-time UX
5. Implement proper typing with the interfaces from Prompt 2
6. Add appropriate Supabase RPC calls or direct queries

### Deliverables
- Updated storage service with new conversation functions
- Unit tests for each function
- Error handling documentation

---

## Prompt 4: Message Routing & Notification Logic
**Priority:** Medium | **Dependencies:** Prompt 3 | **Estimated Time:** 30-45 min

### Task
Implement message routing logic and notification system for dual conversations.

### Requirements
1. Create a message routing service that:
   - Determines which party should receive notifications based on conversation type
   - Handles notification payloads for email/push notifications
   - Supports future auto-routing based on message content
2. Implement notification triggers:
   - Landlord conversation: Notify only landlord
   - Agency conversation: Notify agency staff members
3. Create an escalation tracking system:
   - Track response times for each conversation type
   - Generate suggestions when SLA is breached
4. Add database triggers or edge functions for automated notifications
5. Ensure compatibility with existing `EmailService.ts`

### Deliverables
- Message routing service module
- Database triggers or edge functions
- Integration with existing notification system
- Configuration for SLA thresholds

---

## Prompt 5: Messaging UI Components
**Priority:** High | **Dependencies:** Prompt 2 | **Estimated Time:** 60-90 min

### Task
Create reusable UI components for the dual-conversation interface.

### Requirements
1. Review existing messaging UI components (likely in `src/components/`)
2. Create/update the following components:
   - `ConversationSelector`: Tab/toggle component to switch between landlord and agency conversations
   - `ConversationThread`: Display messages for a specific conversation type
   - `MessageInput`: Enhanced to include conversation type
   - `UnreadBadge`: Show unread counts for each conversation
   - `ConversationHeader`: Display current conversation party info
3. Implement visual indicators for:
   - Active conversation type
   - Separate unread counts
   - Last message timestamp per conversation
   - Response time indicators
4. Ensure mobile-responsive design
5. Add loading states and error handling
6. Implement accessibility features (ARIA labels, keyboard navigation)

### Deliverables
- Reusable React components in TSX
- Component Storybook stories (if applicable)
- CSS/styled-components for styling
- Accessibility audit checklist

---

## Prompt 6: My Tenancy Page Updates
**Priority:** Medium | **Dependencies:** Prompts 2 & 5 | **Estimated Time:** 30-45 min

### Task
Update the My Tenancy page to include separate contact buttons for landlord and agency.

### Requirements
1. Locate the My Tenancy page component (likely `src/pages/` or `src/components/pages/`)
2. Update the contact section to include:
   - "Contact Landlord" button with appropriate icon and styling
   - "Contact Managing Agency" button with appropriate icon and styling
   - Clear labels explaining when to use each (e.g., tooltips or help text)
3. Implement button click handlers that:
   - Open the messaging modal/page
   - Pre-select the correct conversation type
   - Pass necessary context (match ID, conversation type)
4. Handle cases where:
   - Property has no managing agency (hide agency button)
   - Property is self-managed by landlord (show appropriate UI)
5. Add conditional rendering based on match data

### Deliverables
- Updated My Tenancy page component
- Button styles matching the existing design system
- Conditional logic for button visibility
- Integration tests

---

## Prompt 7: Matches Page Conversation Modal
**Priority:** High | **Dependencies:** Prompts 2, 5 & 6 | **Estimated Time:** 60-75 min

### Task
Update the Matches page messaging interface to support conversation switching.

### Requirements
1. Find the existing conversation modal/drawer component
2. Integrate the `ConversationSelector` component from Prompt 5
3. Implement conversation switching logic:
   - Fetch both conversations on modal open
   - Switch between threads without closing modal
   - Maintain scroll position per conversation
   - Update unread counts in real-time
4. Add visual indicators:
   - Tab badges showing unread counts
   - "Faster response" indicator based on historical data
   - Last message preview for each conversation
5. Ensure smooth transitions between conversations
6. Handle real-time message updates for both threads
7. Implement proper cleanup on modal close

### Deliverables
- Updated conversation modal component
- Conversation switching logic
- Real-time subscription management
- Performance optimizations for dual-thread loading

---

## Prompt 8: Data Migration & Seeding Updates
**Priority:** Medium | **Dependencies:** Prompt 1 | **Estimated Time:** 30-45 min

### Task
Update test data seeding and migration scripts to support the new conversation structure.

### Requirements
1. Locate existing seeding scripts (e.g., `seedMessages.ts`, `seedMatches.ts`)
2. Update seeding logic to:
   - Create conversations table entries for test matches
   - Generate both landlord and agency conversation threads
   - Populate realistic message data for both types
   - Set appropriate unread counts
3. Create data migration utilities:
   - Script to migrate production data from old to new schema
   - Validation to ensure no data loss
   - Rollback mechanism
4. Update admin test profiles to include agency-managed properties
5. Ensure seed tags properly identify test conversations

### Deliverables
- Updated seeding scripts
- Migration utility functions
- Validation tests
- Rollback procedures documentation

---

## Prompt 9: Enhanced Features Implementation
**Priority:** Low | **Dependencies:** Prompts 3, 4, 5 | **Estimated Time:** 90-120 min

### Task
Implement enhanced messaging features (auto-routing, templates, read receipts, etc.)

### Requirements
1. **Auto-routing**: 
   - Analyze message content using keywords/NLP
   - Suggest appropriate conversation based on topic
   - Allow user to override suggestions
2. **Message Templates**:
   - Create common message templates for renters
   - Categories: Maintenance, Rent Payment, Contract Questions, etc.
   - Template insertion UI component
3. **Read Receipts**:
   - Track when messages are read
   - Display read status in UI
   - Update database schema if needed
4. **Status Indicators**:
   - Online/offline status for landlords and agencies
   - "Last seen" timestamps
   - "Typing" indicators
5. **Group Chat Option**:
   - Allow including both landlord and agency in same conversation
   - Create a third conversation type: 'group'
   - Update UI to support group conversations

### Deliverables
- Auto-routing service module
- Message templates data and UI
- Read receipts implementation
- Status tracking system
- Group conversation support

---

## Prompt 10: Testing & Validation Suite
**Priority:** High | **Dependencies:** All previous prompts | **Estimated Time:** 60-90 min

### Task
Create comprehensive tests for the dual-conversation messaging system.

### Requirements
1. **Unit Tests**:
   - Storage service functions
   - Message routing logic
   - Type guards and utilities
   - Component rendering
2. **Integration Tests**:
   - End-to-end message flow for each conversation type
   - Notification delivery
   - Conversation switching
   - Unread count accuracy
3. **UI Tests**:
   - Conversation selector functionality
   - Message sending in both threads
   - Real-time updates
   - Error states
4. **Test Scenarios**:
   - Landlord-managed property (no agency)
   - Agency-managed property
   - Mixed conversations with different response times
   - Edge cases (deleted users, archived matches, etc.)
5. **Performance Tests**:
   - Loading time for dual conversations
   - Real-time update latency
   - Database query performance

### Deliverables
- Complete test suite (Jest/Vitest)
- E2E tests (Playwright/Cypress)
- Performance benchmarks
- Test coverage report (aim for >80%)

---

## Prompt 11: Documentation & Developer Guide
**Priority:** Medium | **Dependencies:** All previous prompts | **Estimated Time:** 45-60 min

### Task
Create comprehensive documentation for the messaging system implementation.

### Requirements
1. **Technical Documentation**:
   - Architecture overview with diagrams
   - Database schema documentation
   - API endpoint documentation
   - Component usage guide
2. **Developer Guide**:
   - How to extend the conversation types
   - How to add new message routing rules
   - How to customize notifications
   - Troubleshooting common issues
3. **User Guide**:
   - When to use landlord vs agency conversations
   - How conversation switching works
   - Understanding response time indicators
4. **Migration Guide**:
   - Steps for production deployment
   - Data migration procedures
   - Rollback procedures
   - Breaking changes (if any)

### Deliverables
- Technical documentation in `/docs`
- Developer guide with code examples
- User-facing help documentation
- Mermaid diagrams for architecture

---

## Prompt 12: Performance Optimization & Monitoring
**Priority:** Low | **Dependencies:** Prompts 3, 7, 10 | **Estimated Time:** 45-60 min

### Task
Optimize performance and implement monitoring for the messaging system.

### Requirements
1. **Query Optimization**:
   - Analyze and optimize database queries
   - Implement proper indexing strategies
   - Use query pagination for large conversation histories
   - Cache frequently accessed data
2. **Real-time Optimization**:
   - Minimize Supabase real-time subscription overhead
   - Implement debouncing for typing indicators
   - Optimize re-render performance in React components
3. **Monitoring**:
   - Add logging for message delivery
   - Track conversation switching metrics
   - Monitor notification delivery success rates
   - Set up alerts for failure cases
4. **Performance Metrics**:
   - Message send latency
   - Conversation load time
   - Real-time update latency
   - Unread count accuracy

### Deliverables
- Performance optimization implementations
- Monitoring dashboard configuration
- Performance metrics documentation
- Alert configurations

---

## Execution Strategy

### Phase 1: Foundation (Parallel)
Execute Prompts 1, 2, 3, 4 in parallel. These establish the core infrastructure.

### Phase 2: UI Implementation (Parallel)
Execute Prompts 5, 6, 7 in parallel once Prompt 2 is complete.

### Phase 3: Data & Enhancement (Parallel)
Execute Prompts 8, 9 in parallel once Prompt 1 and 3 are complete.

### Phase 4: Validation (Sequential)
Execute Prompt 10 after all implementation prompts are complete.

### Phase 5: Documentation & Optimization (Parallel)
Execute Prompts 11, 12 in parallel once all core features are tested.

---

## Coordination Points

### Critical Integration Points
1. **Database Schema → TypeScript Types** (Prompts 1 → 2)
2. **Types → Storage Service** (Prompts 2 → 3)
3. **Storage Service → UI Components** (Prompts 3 → 5, 7)
4. **All Implementation → Testing** (All → 10)

### Communication Protocol
- Each prompt should document its outputs in a shared location
- Type definitions should be committed first to avoid conflicts
- UI components should be developed in feature branches
- Integration testing should validate cross-prompt compatibility

---

**Created:** 2025-12-01  
**Status:** Ready for Execution  
**Estimated Total Time:** 8-12 hours (with parallelization)
