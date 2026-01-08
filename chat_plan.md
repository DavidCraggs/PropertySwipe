# Chat Organization Plan: Property-Level Conversations

## Overview

This plan outlines the implementation of granular chat organization for the PropertySwipe platform, splitting conversations by **landlord** and **property** within the Agency and Landlord views.

## Current Architecture

### Existing System
- **Agency ↔ Landlord Conversations**: One conversation per agency-landlord pair stored in `agency_landlord_conversations` table
- **Database Schema**: `UNIQUE(agency_id, landlord_id)` constraint means only one conversation thread exists between each agency and landlord
- **UI Components**: 
  - `AgencyMessagesPage.tsx` - Lists landlords, shows combined conversation
  - `LandlordMessagesPage.tsx` - Lists agencies, shows combined conversation
- **Types**: `AgencyLandlordConversation` has optional `propertyId` field but it's not actively used for filtering

### Current Limitations
1. All messages between an agency and landlord appear in a single thread regardless of which property they concern
2. No way to filter/organize conversations by property
3. Difficult to track property-specific discussions when a landlord has multiple properties

---

## Proposed Architecture

### Option A: Property-Specific Conversation Threads (Recommended)

**Concept**: Create separate conversation threads for each landlord-property combination, with a "General" thread for non-property-specific discussions.

```
Agency View:
├── Landlord A
│   ├── General Discussion
│   ├── 78 Water Street
│   └── 23 Penny Lane
├── Landlord B
│   ├── General Discussion  
│   └── 45 Bold Street
```

**Benefits**:
- Clear separation of property-related discussions
- Easy to trace conversation history for specific properties
- Scales well as portfolios grow

### Option B: Single Thread with Property Tags

**Concept**: Keep single conversation thread but add property tags/filters to messages.

**Benefits**:
- Simpler migration
- Less database changes

**Drawbacks**:
- Still cluttered for high-volume users
- Filtering not as intuitive

---

## Recommended Implementation (Option A)

### Phase 1: Database Schema Changes

#### [NEW] Migration: `20260108_property_level_conversations.sql`

```sql
-- Remove unique constraint on agency_id + landlord_id
-- Add property_id to unique constraint (nullable for general discussions)

-- Modify unique constraint to allow multiple conversations per landlord
ALTER TABLE agency_landlord_conversations 
  DROP CONSTRAINT IF EXISTS agency_landlord_conversations_agency_id_landlord_id_key;

-- Add new unique constraint: one conversation per agency-landlord-property combo
-- NULL property_id = general discussion thread
ALTER TABLE agency_landlord_conversations
  ADD CONSTRAINT alc_unique_conversation 
  UNIQUE NULLS NOT DISTINCT (agency_id, landlord_id, property_id);

-- Add index for property-based queries
CREATE INDEX IF NOT EXISTS idx_alc_property_id 
  ON agency_landlord_conversations(property_id);
```

---

### Phase 2: Type Updates

#### [MODIFY] `src/types/index.ts`

Add new interface for grouped conversations:

```typescript
export interface PropertyConversationGroup {
  propertyId: string | null; // null = general discussion
  propertyAddress?: string;
  conversation: AgencyLandlordConversation;
  unreadCount: number;
  lastMessageAt?: string;
}

export interface LandlordConversationGroup {
  landlord: LandlordProfile;
  propertyConversations: PropertyConversationGroup[];
  totalUnreadCount: number;
}

export interface AgencyConversationGroup {
  agency: AgencyProfile;
  propertyConversations: PropertyConversationGroup[];
  totalUnreadCount: number;
}
```

---

### Phase 3: Storage Layer Updates

#### [MODIFY] `src/lib/storage.ts`

Add new functions:

```typescript
// Get all conversations for an agency, grouped by landlord and property
export async function getAgencyConversationsGrouped(agencyId: string): Promise<LandlordConversationGroup[]>

// Get all conversations for a landlord, grouped by agency and property  
export async function getLandlordConversationsGrouped(landlordId: string): Promise<AgencyConversationGroup[]>

// Get or create a property-specific conversation
export async function getOrCreatePropertyConversation(
  agencyId: string, 
  landlordId: string, 
  propertyId: string | null // null for general discussion
): Promise<AgencyLandlordConversation>

// Send message to property-specific conversation
export async function sendPropertyMessage(params: {
  agencyId: string;
  landlordId: string;
  propertyId: string | null;
  content: string;
  senderId: string;
  senderType: 'agency' | 'landlord';
}): Promise<AgencyLandlordMessage>
```

---

### Phase 4: UI Component Changes

#### [MODIFY] `src/pages/AgencyMessagesPage.tsx`

**New UI Structure**:

```
┌──────────────────────────────────────────────────────┐
│ Messages                                              │
│ 3 landlords                                          │
├──────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐          │
│ │ Landlord A                        2 new │          │
│ │ ├─ General Discussion                   │          │
│ │ ├─ 78 Water Street              1 new  │          │
│ │ └─ 23 Penny Lane                1 new  │          │
│ └─────────────────────────────────────────┘          │
│ ┌─────────────────────────────────────────┐          │
│ │ Landlord B                              │          │
│ │ └─ 45 Bold Street                       │          │
│ └─────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────┘
```

**Changes Required**:
1. Add collapsible landlord sections
2. Show property list under each landlord
3. Track selected property (not just landlord)
4. Update message sending to include propertyId
5. Add "New Conversation" dropdown to select property

#### [MODIFY] `src/pages/LandlordMessagesPage.tsx`

**Mirror changes for landlord view**:

```
┌──────────────────────────────────────────────────────┐
│ Messages                                              │
│ 2 agencies                                           │
├──────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐          │
│ │ Liverpool Prime Lettings           1 new│          │
│ │ ├─ General Discussion                   │          │
│ │ ├─ 78 Water Street              1 new  │          │
│ │ └─ 23 Penny Lane                        │          │
│ └─────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────┘
```

---

### Phase 5: New Component

#### [NEW] `src/components/molecules/PropertyConversationList.tsx`

Reusable component for displaying property-grouped conversations:

```typescript
interface PropertyConversationListProps {
  conversations: PropertyConversationGroup[];
  selectedPropertyId: string | null;
  onSelectProperty: (propertyId: string | null) => void;
  showPropertyAddress: boolean;
}
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/20260108_property_level_conversations.sql` | NEW | Schema changes for property-level conversations |
| `src/types/index.ts` | MODIFY | Add PropertyConversationGroup, LandlordConversationGroup, AgencyConversationGroup interfaces |
| `src/lib/storage.ts` | MODIFY | Add grouped conversation queries and property-specific message functions |
| `src/pages/AgencyMessagesPage.tsx` | MODIFY | Restructure UI for landlord → property hierarchy |
| `src/pages/LandlordMessagesPage.tsx` | MODIFY | Restructure UI for agency → property hierarchy |
| `src/components/molecules/PropertyConversationList.tsx` | NEW | Reusable property conversation list component |

---

## Migration Strategy

### Data Migration

1. **Existing conversations** remain as "General Discussion" threads (propertyId = NULL)
2. **No data loss** - all existing messages preserved
3. **New conversations** created when users start property-specific discussions

### Backward Compatibility

- Existing API functions continue to work (default to general discussion)
- New UI shows both general and property-specific threads
- Gradual adoption - users can continue using general threads

---

## Verification Plan

### Automated Tests

> [!NOTE]
> Need to check for existing test files and patterns before finalizing test commands.

1. **Unit Tests** for storage functions:
   - Test `getAgencyConversationsGrouped` returns correct structure
   - Test `getLandlordConversationsGrouped` returns correct structure
   - Test `getOrCreatePropertyConversation` creates new or returns existing
   - Test `sendPropertyMessage` associates message with correct property

2. **Integration Tests** for database:
   - Test unique constraint allows multiple conversations per landlord (different properties)
   - Test queries correctly filter by property_id

### Manual Testing

1. **Agency View Testing**:
   - Log in as test estate agent
   - Navigate to Messages page
   - Verify landlords are listed with expandable property sections
   - Select a property conversation and send a message
   - Verify message appears in correct property thread

2. **Landlord View Testing**:
   - Log in as test landlord with multiple properties
   - Navigate to Messages  
   - Verify agencies are listed with property sections
   - Send message in property-specific thread
   - Verify message appears correctly

3. **Cross-User Verification**:
   - Send message as agency to landlord (property-specific)
   - Log in as landlord and verify message appears in correct property thread
   - Reply as landlord
   - Verify agency sees reply in correct thread

---

## Questions for User

1. **General Discussion Thread**: Should there always be a "General Discussion" thread for non-property-specific conversations, or should all conversations be property-specific?

2. **New Conversation Flow**: When starting a new conversation, should the user:
   - Select a property from a dropdown?
   - Have a default "General" option?
   - Be required to select a property?

3. **Unread Badges**: How should unread counts be displayed?
   - Per-landlord total only?
   - Per-property breakdown?
   - Both (expandable)?

4. **Mobile UI**: Should the property list be:
   - Always visible (collapsible accordion)?
   - Hidden until landlord is selected (drill-down)?
