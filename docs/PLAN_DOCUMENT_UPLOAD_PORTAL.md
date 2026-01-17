# Plan: Document Upload Portal for Tenancy Agreements

## Overview
A document upload portal allowing landlords and estate agents to upload their own tenancy agreements, collect electronic signatures from tenants, and provide signed copies for download.

---

## 1. Database Schema

### New Tables

```sql
-- Tenancy agreement documents
CREATE TABLE tenancy_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) NOT NULL,
  property_id UUID REFERENCES properties(id) NOT NULL,
  landlord_id UUID REFERENCES landlord_profiles(id) NOT NULL,
  agency_id UUID REFERENCES agency_profiles(id),
  renter_id UUID REFERENCES renter_profiles(id) NOT NULL,

  -- Document storage
  original_document_path TEXT NOT NULL,        -- Supabase storage path
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,                     -- application/pdf
  file_size_bytes INTEGER NOT NULL,

  -- Signed version (generated after all signatures)
  signed_document_path TEXT,
  signed_at TIMESTAMPTZ,

  -- Metadata
  title TEXT NOT NULL,                         -- e.g., "Assured Shorthold Tenancy Agreement"
  description TEXT,
  tenancy_start_date DATE,
  tenancy_end_date DATE,                       -- NULL for periodic
  rent_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending_signatures',
  -- Values: draft, pending_signatures, partially_signed, fully_signed, expired, cancelled

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,

  -- Expiry (agreements expire if not signed within 14 days)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days')
);

-- Required signatories for each agreement
CREATE TABLE agreement_signatories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES tenancy_agreements(id) ON DELETE CASCADE,

  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,                     -- 'landlord', 'agency', 'renter'
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,

  signing_order INTEGER NOT NULL DEFAULT 1,    -- Order of signing (1 = first)
  is_required BOOLEAN DEFAULT TRUE,

  -- Signature data
  has_signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  signature_data TEXT,                         -- Base64 signature image or typed name
  signature_type TEXT,                         -- 'draw', 'type', 'upload'
  ip_address TEXT,
  user_agent TEXT,

  -- Notifications
  invitation_sent_at TIMESTAMPTZ,
  last_reminder_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for all agreement actions
CREATE TABLE agreement_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES tenancy_agreements(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  -- Actions: created, viewed, downloaded, signed, reminder_sent, expired, cancelled
  performed_by UUID,
  performed_by_type TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_agreements_match ON tenancy_agreements(match_id);
CREATE INDEX idx_agreements_landlord ON tenancy_agreements(landlord_id);
CREATE INDEX idx_agreements_renter ON tenancy_agreements(renter_id);
CREATE INDEX idx_agreements_status ON tenancy_agreements(status);
CREATE INDEX idx_signatories_agreement ON agreement_signatories(agreement_id);
CREATE INDEX idx_signatories_user ON agreement_signatories(user_id);
CREATE INDEX idx_audit_agreement ON agreement_audit_log(agreement_id);
```

### Row Level Security

```sql
-- Tenancy agreements: visible to landlord, agency, and renter involved
ALTER TABLE tenancy_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agreements" ON tenancy_agreements
  FOR SELECT USING (
    auth.uid() = landlord_id OR
    auth.uid() = agency_id OR
    auth.uid() = renter_id
  );

CREATE POLICY "Landlords/agencies can create agreements" ON tenancy_agreements
  FOR INSERT WITH CHECK (
    auth.uid() = landlord_id OR auth.uid() = agency_id
  );

CREATE POLICY "Landlords/agencies can update their agreements" ON tenancy_agreements
  FOR UPDATE USING (
    auth.uid() = landlord_id OR auth.uid() = agency_id
  );

-- Signatories: only visible to the signer or agreement owner
ALTER TABLE agreement_signatories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signatories for their agreements" ON agreement_signatories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenancy_agreements
      WHERE id = agreement_id
      AND (landlord_id = auth.uid() OR agency_id = auth.uid() OR renter_id = auth.uid())
    )
  );
```

---

## 2. Supabase Storage Setup

### Bucket Configuration

```typescript
// New bucket for tenancy agreements
const AGREEMENTS_BUCKET = 'tenancy-agreements';

// Folder structure:
// /original/{agreement_id}/{filename}     - Original uploaded document
// /signed/{agreement_id}/{filename}       - Signed PDF with embedded signatures
// /signatures/{agreement_id}/{user_id}.png - Individual signature images
```

### Storage Policies

```sql
-- Only authenticated users can access their own agreements
CREATE POLICY "Users can access their agreement documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenancy-agreements' AND
  EXISTS (
    SELECT 1 FROM tenancy_agreements
    WHERE id::text = (storage.foldername(name))[2]
    AND (landlord_id = auth.uid() OR agency_id = auth.uid() OR renter_id = auth.uid())
  )
);
```

---

## 3. TypeScript Types

### New Types (add to `/src/types/index.ts`)

```typescript
export type AgreementStatus =
  | 'draft'
  | 'pending_signatures'
  | 'partially_signed'
  | 'fully_signed'
  | 'expired'
  | 'cancelled';

export type SignatureType = 'draw' | 'type' | 'upload';

export interface TenancyAgreement {
  id: string;
  matchId: string;
  propertyId: string;
  landlordId: string;
  agencyId?: string;
  renterId: string;

  // Document
  originalDocumentPath: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  signedDocumentPath?: string;
  signedAt?: Date;

  // Metadata
  title: string;
  description?: string;
  tenancyStartDate?: Date;
  tenancyEndDate?: Date;
  rentAmount?: number;
  depositAmount?: number;

  // Status
  status: AgreementStatus;
  expiresAt: Date;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  // Joined data
  signatories?: AgreementSignatory[];
  property?: Property;
}

export interface AgreementSignatory {
  id: string;
  agreementId: string;
  userId: string;
  userType: 'landlord' | 'agency' | 'renter';
  userEmail: string;
  userName: string;
  signingOrder: number;
  isRequired: boolean;

  // Signature
  hasSigned: boolean;
  signedAt?: Date;
  signatureData?: string;
  signatureType?: SignatureType;
  ipAddress?: string;

  // Notifications
  invitationSentAt?: Date;
  lastReminderAt?: Date;
  reminderCount: number;
}

export interface AgreementAuditEntry {
  id: string;
  agreementId: string;
  action: 'created' | 'viewed' | 'downloaded' | 'signed' | 'reminder_sent' | 'expired' | 'cancelled';
  performedBy?: string;
  performedByType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}
```

---

## 4. Component Architecture

### Component Tree

```
src/components/
├── organisms/
│   ├── agreements/
│   │   ├── UploadAgreementModal.tsx       # Upload new agreement
│   │   ├── AgreementsList.tsx             # List of agreements
│   │   ├── AgreementCard.tsx              # Single agreement summary
│   │   ├── AgreementDetailModal.tsx       # View agreement details
│   │   ├── SignAgreementModal.tsx         # Signing interface for tenants
│   │   ├── SignatureCanvas.tsx            # Draw signature component
│   │   ├── SignatureTypeInput.tsx         # Type signature component
│   │   └── PDFViewer.tsx                  # View PDF documents
│   │
├── molecules/
│   ├── DocumentUploader.tsx               # PDF upload with validation
│   ├── SignatoryList.tsx                  # List of signatories + status
│   └── AgreementStatusBadge.tsx           # Status indicator
│
└── pages/
    └── AgreementsPage.tsx                 # Main agreements dashboard
```

### Key Components

#### 1. UploadAgreementModal

```typescript
interface UploadAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  onSuccess: (agreement: TenancyAgreement) => void;
}

// Features:
// - PDF file upload (max 10MB)
// - Agreement title and description
// - Tenancy dates and rent details
// - Select signatories (landlord required, agency optional)
// - Preview before upload
```

#### 2. SignAgreementModal (Tenant View)

```typescript
interface SignAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: TenancyAgreement;
  onSigned: () => void;
}

// Features:
// - PDF viewer (read-only)
// - Signature options: Draw / Type / Upload
// - Legal disclaimer checkbox
// - Timestamp and IP capture
// - Download signed copy after all signatures
```

#### 3. SignatureCanvas

```typescript
interface SignatureCanvasProps {
  onSignatureComplete: (signatureData: string) => void;
  width?: number;
  height?: number;
}

// Features:
// - Touch and mouse drawing support
// - Clear button
// - Undo functionality
// - Export as base64 PNG
```

#### 4. PDFViewer

```typescript
interface PDFViewerProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  showDownload?: boolean;  // false for unsigned, true for signed
}

// Uses: react-pdf or pdf.js
// Features:
// - Page navigation
// - Zoom controls
// - Watermark for unsigned versions
// - Print disabled for unsigned
```

---

## 5. Service Layer

### File: `/src/lib/agreementService.ts`

```typescript
// Upload agreement
export async function uploadAgreement(
  file: File,
  matchId: string,
  metadata: {
    title: string;
    description?: string;
    tenancyStartDate?: Date;
    tenancyEndDate?: Date;
    rentAmount?: number;
    depositAmount?: number;
  },
  signatories: Array<{
    userId: string;
    userType: 'landlord' | 'agency' | 'renter';
    userEmail: string;
    userName: string;
    signingOrder: number;
  }>
): Promise<TenancyAgreement>

// Get agreements for user
export async function getUserAgreements(
  userId: string,
  userType: 'landlord' | 'agency' | 'renter'
): Promise<TenancyAgreement[]>

// Get single agreement with signatories
export async function getAgreement(
  agreementId: string
): Promise<TenancyAgreement | null>

// Get signed URL for viewing document
export async function getDocumentUrl(
  agreementId: string,
  documentType: 'original' | 'signed'
): Promise<string>

// Sign agreement
export async function signAgreement(
  agreementId: string,
  signatureData: string,
  signatureType: SignatureType
): Promise<void>

// Generate signed PDF (after all signatures)
export async function generateSignedPdf(
  agreementId: string
): Promise<string> // Returns signed document path

// Send reminder to pending signatories
export async function sendSigningReminder(
  agreementId: string,
  signatoryId: string
): Promise<void>

// Cancel agreement
export async function cancelAgreement(
  agreementId: string,
  reason: string
): Promise<void>

// Log audit entry
export async function logAuditEntry(
  agreementId: string,
  action: AgreementAuditEntry['action'],
  metadata?: Record<string, unknown>
): Promise<void>
```

---

## 6. User Flows

### Flow 1: Landlord Uploads Agreement

```
1. Landlord navigates to Matches → selects match with offer_accepted status
2. Clicks "Upload Tenancy Agreement" button
3. UploadAgreementModal opens:
   a. Upload PDF file (drag & drop or browse)
   b. Enter agreement title
   c. Enter optional details (dates, rent)
   d. Confirm signatories (self + tenant)
   e. Preview document
   f. Click "Send for Signing"
4. System:
   a. Uploads PDF to Supabase Storage
   b. Creates tenancy_agreements record
   c. Creates agreement_signatories records
   d. Sends notification to tenant
   e. Logs audit entry
5. Modal shows success, agreement appears in list
```

### Flow 2: Tenant Signs Agreement

```
1. Tenant receives notification (toast + email)
2. Navigates to Matches or Agreements page
3. Sees "Sign Agreement" button (highlighted)
4. Clicks button, SignAgreementModal opens:
   a. PDF viewer shows agreement (read-only, watermarked)
   b. Must scroll through entire document
   c. Signature section at bottom:
      - Choose: Draw / Type / Upload signature
      - Draw: Canvas for finger/mouse drawing
      - Type: Enter name, select font style
      - Upload: Upload signature image
   d. Checkbox: "I have read and agree to the terms"
   e. Click "Sign Agreement"
5. System:
   a. Saves signature data
   b. Updates signatory record
   c. Logs audit entry
   d. If all signed → generates signed PDF
   e. Notifies landlord
6. Tenant can download signed PDF
```

### Flow 3: Download Signed Agreement

```
1. Either party navigates to Agreements
2. Finds fully_signed agreement
3. Clicks "Download Signed Copy"
4. System:
   a. Logs audit entry
   b. Returns signed PDF with embedded signatures
5. PDF downloads (non-editable, with signature pages)
```

---

## 7. Security Considerations

### Document Security
- PDFs stored in private Supabase bucket
- Signed URLs with 5-minute expiry
- No direct public access
- Watermark on unsigned documents: "DRAFT - NOT LEGALLY BINDING"

### Signature Verification
- Capture IP address and user agent
- Timestamp with timezone
- Require authentication before signing
- Store signature in separate table for audit

### Access Control
- RLS policies restrict access to parties involved
- Audit log for all document access
- Cannot modify after any signature
- Expiry after 14 days if not fully signed

### Legal Compliance
- Electronic signatures valid under UK law (Electronic Communications Act 2000)
- Clear consent checkbox before signing
- Timestamp and audit trail
- PDF/A format for long-term storage

---

## 8. Implementation Phases

### Phase 1: Core Infrastructure (2-3 days)
- [ ] Create database tables and RLS policies
- [ ] Set up Supabase Storage bucket
- [ ] Create TypeScript types
- [ ] Implement agreementService.ts core functions

### Phase 2: Upload Flow (2-3 days)
- [ ] DocumentUploader component
- [ ] UploadAgreementModal component
- [ ] Integration with MatchesPage
- [ ] Notification when agreement uploaded

### Phase 3: Signing Flow (3-4 days)
- [ ] PDFViewer component (using react-pdf)
- [ ] SignatureCanvas component
- [ ] SignatureTypeInput component
- [ ] SignAgreementModal component
- [ ] Integration with tenant view

### Phase 4: Signed PDF Generation (2 days)
- [ ] PDF manipulation service (pdf-lib)
- [ ] Embed signatures into PDF
- [ ] Generate final signed document
- [ ] Download functionality

### Phase 5: Polish & Notifications (2 days)
- [ ] AgreementsList and AgreementCard
- [ ] Status badges and progress indicators
- [ ] Email notifications (Supabase Edge Functions)
- [ ] Reminder system for pending signatures

### Phase 6: Testing & Security (1-2 days)
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Error handling and edge cases

---

## 9. Dependencies

### NPM Packages to Add

```json
{
  "react-pdf": "^7.x",           // PDF viewing
  "pdf-lib": "^1.17.x",          // PDF manipulation (adding signatures)
  "react-signature-canvas": "^1.x", // Signature drawing
  "@react-pdf/renderer": "^3.x"  // Optional: Generate PDFs from React
}
```

---

## 10. API Endpoints (if using Edge Functions)

```
POST   /api/agreements              - Upload new agreement
GET    /api/agreements              - List user's agreements
GET    /api/agreements/:id          - Get agreement details
POST   /api/agreements/:id/sign     - Sign agreement
GET    /api/agreements/:id/document - Get document URL
POST   /api/agreements/:id/remind   - Send reminder
DELETE /api/agreements/:id          - Cancel agreement
GET    /api/agreements/:id/audit    - Get audit log
```

---

## 11. Success Metrics

- Time to upload agreement: < 2 minutes
- Time to sign agreement: < 5 minutes
- Signature completion rate: > 90%
- Document security: Zero unauthorized access
- Audit completeness: 100% of actions logged
