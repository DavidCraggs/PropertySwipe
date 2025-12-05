# Messaging System Requirements

## Current State (MVP)
- Single message thread per Match (stored in `matches.messages` as jsonb array)
- Messaging UI exists but send functionality is placeholder
- Both "Contact Landlord" and "Contact Agency" buttons navigate to the same conversation

## Future Requirements

### Separate Conversation Threads
**Requirement:** Renters need ability to have separate conversations with landlords AND managing agencies.

**Use Case:** When a landlord is completely hands-off and the property is managed by an agency, the renter needs to:
- Message the agency for day-to-day issues (maintenance, rent payments, etc.)
- Message the landlord directly for contract-related matters or if agency is unresponsive

### Implementation Approach

#### Database Schema Changes
```sql
-- Option 1: Separate message arrays in matches table
ALTER TABLE matches
  ADD COLUMN landlord_messages jsonb[] DEFAULT '{}',
  ADD COLUMN agency_messages jsonb[] DEFAULT '{}';

-- Option 2: Separate conversations table (more scalable)
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES matches(id),
  conversation_type text NOT NULL, -- 'landlord' | 'agency'
  messages jsonb[] DEFAULT '{}',
  unread_count_renter integer DEFAULT 0,
  unread_count_other integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### UI Changes
**My Tenancy Page:**
- Two separate contact buttons with clear labels:
  - "Contact Landlord" (for contract/legal matters)
  - "Contact Managing Agency" (for day-to-day issues)

**Matches Page:**
- Conversation modal includes tab/selector to switch between:
  - "Landlord Conversation"
  - "Agency Conversation"
- Separate unread counts for each conversation type
- Visual indicator showing which party typically responds faster

#### Message Routing Logic
- Messages to landlord: Only landlord receives notification
- Messages to agency: Agency staff members receive notification
- System could include "escalation" feature:
  - If agency doesn't respond within SLA, suggest messaging landlord
  - If landlord doesn't respond, suggest messaging agency

### Additional Features to Consider
- **Auto-routing:** Based on message content (e.g., "maintenance" → agency, "contract" → landlord)
- **Group chat option:** Include both landlord and agency in same conversation for important matters
- **Status indicators:** Show who is "active" or "last seen" for each party
- **Message templates:** Pre-written messages for common requests
- **Read receipts:** Show when messages have been read by recipient

### Priority
**Medium Priority** - Core tenancy functionality works without this, but important for user experience in agency-managed properties.

### Dependencies
- Complete messaging system implementation (currently placeholder)
- Real-time notification system
- Mobile push notifications (if mobile app exists)

### Testing Requirements
- Test with landlord-managed properties (no agency)
- Test with agency-managed properties (hands-off landlord)
- Test message routing and notifications
- Test conversation switching UX
- Test unread count accuracy for both threads

---

**Created:** 2025-11-30  
**Status:** Planned  
**Assigned:** TBD
