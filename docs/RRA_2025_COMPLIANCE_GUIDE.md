# RRA 2025 Compliance Guide for Developers

## Overview

The **Renters' Rights Act 2025 (RRA 2025)** is UK legislation that prohibits landlords from requesting or accepting rent above the advertised price. This practice, known as "rent bidding," is **illegal** and can result in **fines up to £7,000**.

PropertySwipe enforces RRA 2025 compliance through automated message validation to protect both landlords and renters from legal violations.

---

## 🚨 Critical Requirements

### What is Prohibited

Landlords **CANNOT**:
- Request rent above the advertised price
- Accept offers above the advertised price
- Suggest or imply that higher rent offers will be considered
- Create bidding scenarios between multiple applicants
- Use auction-style language when discussing rent

### Legal Penalties

- **Fine**: Up to £7,000 per violation
- **Reputation damage**: Negative publicity and platform bans
- **Legal action**: Potential civil suits from affected renters

---

## 📋 Implementation in PropertySwipe

### Message Validation System

Location: [src/utils/messageValidation.ts](../src/utils/messageValidation.ts)

#### Core Function

```typescript
validateMessage(
  message: string,
  senderType: 'landlord' | 'renter',
  advertisedRent?: number
): ValidationResult
```

**Behavior**:
- **Renter messages**: No validation applied (renters can offer more if they choose)
- **Landlord messages**: Full validation against 27+ prohibited patterns
- **Returns**: `{ isValid: boolean, error?: string, bannedPhrases?: string[] }`

#### Key Features

1. **Pattern-Based Detection**: 27+ regex patterns detect rent bidding language
2. **Case-Insensitive**: Works regardless of capitalization
3. **False Positive Prevention**: Allows legitimate phrases like "no more viewings"
4. **Numeric Validation**: Detects specific amounts above advertised rent
5. **Multi-Format Support**: Handles £1,200, £1200, "per month", "pcm", etc.

---

## 🔍 Prohibited Patterns

### Category 1: Direct Offers Above Asking

**Examples** (ILLEGAL for landlords to send):
- ❌ "Would you be willing to offer more?"
- ❌ "Can you offer above the asking price?"
- ❌ "We're looking for offers higher than listed"
- ❌ "I'll accept an offer extra than advertised"

**Regex Patterns**:
```typescript
/offer\s+(more|above|higher|extra)/i
```

### Category 2: Willingness to Pay Patterns

**Examples** (ILLEGAL):
- ❌ "Are you willing to pay more than £1000?"
- ❌ "Would you pay extra per month?"
- ❌ "Can you afford to pay higher rent?"

**Regex Patterns**:
```typescript
/willing\s+to\s+pay\s+(more|extra|higher)/i
```

### Category 3: Direct Requests for More Money

**Examples** (ILLEGAL):
- ❌ "Can you pay more than the advertised rent?"
- ❌ "Could you pay extra per month?"
- ❌ "Can you offer higher than £1200?"

**Regex Patterns**:
```typescript
/can\s+you\s+pay\s+(more|extra|higher)/i
```

### Category 4: Bidding & Auction Language

**Examples** (ILLEGAL):
- ❌ "Highest bidder gets the property"
- ❌ "We'll accept the best offer"
- ❌ "There's a bidding war for this property"
- ❌ "I'll consider the highest offer"
- ❌ "This is basically a rent auction"

**Regex Patterns**:
```typescript
/bid\s+higher/i
/outbid/i
/best\s+offer/i
/highest\s+(bidder|offer)/i
/bidding\s+war/i
/rent\s+auction/i
```

### Category 5: Conditional on Higher Payment

**Examples** (ILLEGAL):
- ❌ "The property is yours if you pay more"
- ❌ "Provided you pay £100 extra, you can have it"
- ❌ "Only if you offer higher will I consider you"

**Regex Patterns**:
```typescript
/if\s+you\s+pay\s+(more|extra)/i
/provided\s+you\s+pay/i
/only\s+if\s+you\s+(offer|pay)\\s+(more|higher)/i
```

### Category 6: Numeric Amounts Above Advertised

**Examples** (ILLEGAL when above advertised rent):
- ❌ "The rent would be £1,200/month" (when advertised is £1,000)
- ❌ "You'd need to pay £1200 pcm" (when advertised is £1,000)
- ❌ "It's £1200 per month" (when advertised is £1,000)

**Detection Logic**:
```typescript
if (advertisedRent) {
  const rentMentionPattern = /£(\d{1,5})\s*(per\s+month|pcm|monthly|\/month)?/gi;
  const matches = [...message.matchAll(rentMentionPattern)];

  for (const match of matches) {
    const mentionedAmount = parseInt(match[1]);
    if (mentionedAmount > advertisedRent) {
      // VIOLATION DETECTED
    }
  }
}
```

---

## ✅ Allowed Patterns (False Positive Prevention)

These phrases are **ALLOWED** even though they contain words like "more" or "pay":

### Legitimate Landlord Messages

✅ "There are **no more** viewings available"
✅ "I'm **not willing to** accept more applications"
✅ "You **cannot pay** in cash, only bank transfer"
✅ "We **won't** be accepting more offers"

**Why Allowed**: These use negative constructions that don't request more money

### Regex Patterns for Allowed Phrases

```typescript
const ALLOWED_PATTERNS = [
  /no\s+more/i,
  /not\s+(willing|able)\s+to\s+pay\s+more/i,
  /cannot\s+pay\s+more/i,
  /won't\s+pay\s+more/i,
];
```

---

## 🛠️ Using the Validation System

### Example 1: Basic Validation

```typescript
import { validateMessage } from '@/utils/messageValidation';

// Landlord sending a message
const result = validateMessage(
  "Can you pay more than £1000?",
  'landlord',
  1000
);

if (!result.isValid) {
  console.error(result.error);
  // Error: "This message violates the Renters' Rights Act 2025..."
  console.log('Banned phrases:', result.bannedPhrases);
  // ['Can you pay more']
}
```

### Example 2: In a Component

```tsx
import { validateMessage, getValidationErrorMessage } from '@/utils/messageValidation';

function MessageInput({ senderType, advertisedRent }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSend = () => {
    const validation = validateMessage(message, senderType, advertisedRent);

    if (!validation.isValid) {
      setError(getValidationErrorMessage(validation));
      return;
    }

    // Send message...
  };

  return (
    <div>
      <textarea value={message} onChange={e => setMessage(e.target.value)} />
      {error && <div className="error">{error}</div>}
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### Example 3: With Advertised Rent Context

```typescript
// In a conversation component
const property = {
  id: '123',
  rent: 1200,
  title: '2 Bed Flat in Manchester'
};

// Validate landlord message
const result = validateMessage(
  landlordMessage,
  'landlord',
  property.rent // Pass the advertised rent
);
```

---

## 🧪 Testing Your Implementation

### Unit Tests

Location: [tests/unit/utils/messageValidation.test.ts](../tests/unit/utils/messageValidation.test.ts)

**75 comprehensive tests** cover:
- All 27+ prohibited patterns
- False positive prevention
- Edge cases (empty messages, long messages, etc.)
- Numeric validation with various currency formats
- Case sensitivity
- Multiple pattern violations

### Running Tests

```bash
# Run all tests
npm run test

# Run only messageValidation tests
npm run test messageValidation

# Run with coverage
npm run test:coverage
```

### Example Test Cases

```typescript
describe('RRA 2025 Message Validation', () => {
  it('should detect "offer more" pattern', () => {
    const result = validateMessage(
      'Would you be willing to offer more?',
      'landlord'
    );
    expect(result.isValid).toBe(false);
    expect(result.bannedPhrases).toContain('offer more');
  });

  it('should allow "no more" pattern', () => {
    const result = validateMessage(
      'There are no more viewings available',
      'landlord'
    );
    expect(result.isValid).toBe(true);
  });

  it('should detect rent amount above advertised', () => {
    const result = validateMessage(
      'The rent would be £1200 per month',
      'landlord',
      1000
    );
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('£1,200');
    expect(result.error).toContain('above the advertised rent of £1,000');
  });
});
```

---

## 🚀 Integration Guidelines

### When to Apply Validation

**Always validate** when:
- Landlord sends a message to a renter
- Landlord creates a property listing description
- Landlord responds to rent-related inquiries
- Any communication about property pricing

**Don't validate** when:
- Renter sends a message (they're allowed to offer more)
- Landlord sends messages about non-rent topics
- System-generated messages

### Where to Integrate

1. **Message Sending UI** ([src/components/MessageInput.tsx](../src/components/MessageInput.tsx))
   - Validate before sending
   - Show inline error if validation fails
   - Block message submission

2. **Property Listing Creation** ([src/pages/CreateProperty.tsx](../src/pages/CreateProperty.tsx))
   - Validate property description
   - Validate any additional notes

3. **Backend API** (Supabase Edge Functions)
   - Server-side validation for security
   - Prevent bypassing client-side validation
   - Log violations for monitoring

### UI/UX Best Practices

**Error Display**:
```tsx
{validationError && (
  <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mt-2">
    <div className="flex items-start">
      <AlertTriangle className="w-5 h-5 text-danger-600 mr-2 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-danger-900">
          Message Violates RRA 2025
        </p>
        <p className="text-sm text-danger-700 mt-1">
          {validationError}
        </p>
      </div>
    </div>
  </div>
)}
```

**User Education**:
- Show tooltip on first message: "We automatically check messages for RRA 2025 compliance"
- Link to help article about rent bidding laws
- Provide examples of compliant vs. non-compliant messages

---

## 🔒 Security Considerations

### Client-Side Validation Alone is NOT Enough

**Why**:
- Users can bypass client-side validation using browser DevTools
- Malicious actors can send direct API requests
- Protection must exist at multiple layers

**Solution**:
1. ✅ **Client-side**: Fast feedback for legitimate users
2. ✅ **Server-side**: Enforce validation in Supabase Edge Functions
3. ✅ **Database**: Log all flagged messages for audit trail

### Audit Trail

Store validation failures for compliance auditing:

```typescript
// In your message sending function
if (!validation.isValid) {
  await supabase.from('rra_violations').insert({
    user_id: userId,
    message: message,
    banned_phrases: validation.bannedPhrases,
    timestamp: new Date().toISOString(),
    property_id: propertyId,
    advertised_rent: advertisedRent,
  });
}
```

### Rate Limiting

Implement rate limiting for users who repeatedly violate:

```typescript
const violations = await supabase
  .from('rra_violations')
  .select('*')
  .eq('user_id', userId)
  .gte('timestamp', oneHourAgo);

if (violations.length > 5) {
  // Temporarily suspend messaging
  // Or require manual review
}
```

---

## 📊 Monitoring & Reporting

### Metrics to Track

1. **Violation Rate**: % of messages flagged
2. **Top Patterns**: Which patterns are most commonly violated
3. **User Education Effectiveness**: Do violations decrease over time?
4. **False Positives**: Messages incorrectly flagged (user reported)

### Dashboard Example

```typescript
// Analytics query
const stats = await supabase
  .from('rra_violations')
  .select('banned_phrases, count')
  .gte('timestamp', last30Days);

// Most common violations
const topPatterns = stats.reduce((acc, curr) => {
  curr.banned_phrases.forEach(phrase => {
    acc[phrase] = (acc[phrase] || 0) + 1;
  });
  return acc;
}, {});
```

---

## 🐛 Troubleshooting

### Issue: Legitimate Message Flagged

**Symptom**: User reports a legitimate message was blocked

**Solution**:
1. Review the message and `bannedPhrases` array
2. If false positive, add to `ALLOWED_PATTERNS` in [messageValidation.ts](../src/utils/messageValidation.ts)
3. Write a test case to prevent regression
4. Deploy update

**Example Fix**:
```typescript
// User reported: "I have no more properties available" was flagged
// Add to ALLOWED_PATTERNS:
/no\s+more\s+properties/i
```

### Issue: Validation Not Applied

**Symptom**: Prohibited message was sent successfully

**Checklist**:
- ✅ Is `senderType` correctly set to `'landlord'`?
- ✅ Is validation function called before message submission?
- ✅ Is validation result checked (`!result.isValid`)?
- ✅ Is server-side validation also implemented?

### Issue: Numeric Validation Not Working

**Symptom**: Message with £1500 not flagged when advertised rent is £1000

**Checklist**:
- ✅ Is `advertisedRent` parameter passed to `validateMessage()`?
- ✅ Is `advertisedRent` a number (not string)?
- ✅ Is `advertisedRent` greater than 0?

**Debug**:
```typescript
console.log('Advertised rent:', advertisedRent, typeof advertisedRent);
console.log('Validation result:', result);
```

---

## 📚 Additional Resources

### Legal References
- [Renters' Rights Act 2025 (UK Government)](https://www.gov.uk/government/publications/renters-rights-act-2025)
- [Rent Bidding Ban Guidance](https://www.gov.uk/guidance/rent-bidding-ban)

### Internal Documentation
- [Testing Implementation Status](../TESTING_IMPLEMENTATION_STATUS.md)
- [RRA 2025 Implementation Status](../RRA_2025_IMPLEMENTATION_STATUS.md)
- [Message Validation Tests](../tests/unit/utils/messageValidation.test.ts)

### Related Files
- **Implementation**: [src/utils/messageValidation.ts](../src/utils/messageValidation.ts)
- **Tests**: [tests/unit/utils/messageValidation.test.ts](../tests/unit/utils/messageValidation.test.ts)
- **Types**: [src/types/index.ts](../src/types/index.ts)

---

## 🤝 Contributing

### Adding New Patterns

1. **Identify the violation pattern** from user reports or legal updates
2. **Add regex to `RENT_BIDDING_PATTERNS`** in [messageValidation.ts](../src/utils/messageValidation.ts:18)
3. **Write test cases** in [messageValidation.test.ts](../tests/unit/utils/messageValidation.test.ts)
4. **Verify no false positives** by testing legitimate messages
5. **Update this guide** with the new pattern category

### Example Contribution

```typescript
// 1. Add to RENT_BIDDING_PATTERNS
/prefer\s+tenants\s+who\s+pay\s+(more|higher)/i

// 2. Add test
it('should detect "prefer tenants who pay more" pattern', () => {
  const result = validateMessage(
    'I prefer tenants who pay more than the listed rent',
    'landlord'
  );
  expect(result.isValid).toBe(false);
  expect(result.bannedPhrases).toContain('prefer tenants who pay more');
});

// 3. Run tests
npm run test messageValidation

// 4. Update this guide (new section or add to existing category)
```

---

## ✅ Checklist for New Features

When implementing new messaging or property listing features:

- [ ] Identify if landlords can send free-form text
- [ ] Integrate `validateMessage()` before submission
- [ ] Pass correct `senderType` ('landlord' or 'renter')
- [ ] Pass `advertisedRent` when available
- [ ] Display validation errors clearly to users
- [ ] Implement server-side validation
- [ ] Log violations for audit trail
- [ ] Write integration tests
- [ ] Update user documentation
- [ ] Add to this compliance guide

---

**Last Updated**: 2025-01-09
**Version**: 1.0
**Maintained By**: PropertySwipe Development Team

**Questions or Issues?** Open an issue in the repository or contact the compliance team.
