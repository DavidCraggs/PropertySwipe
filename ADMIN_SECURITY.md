# Admin System Security Documentation

## Overview
The admin role switching system provides development and testing capabilities for the PropertySwipe (GetOn) platform. This document outlines security considerations and best practices.

## ⚠️ Security Warnings

### Current Implementation (Development)
- Admin credentials stored in localStorage
- Password hashing using client-side SHA-256
- No rate limiting on admin login attempts
- No IP whitelisting
- No MFA/2FA support

### Production Requirements
Before deploying to production, implement:

1. **Backend Authentication**
   - Move admin verification to secure backend
   - Use OAuth 2.0 or JWT tokens
   - Store credentials in secure secrets management (AWS Secrets Manager, HashiCorp Vault)

2. **Access Controls**
   - IP whitelisting for admin routes
   - VPN requirement for admin access
   - Rate limiting (max 3 failed attempts per 15 minutes)

3. **Audit Logging**
   - Log all admin logins
   - Log all role switches
   - Log admin actions with timestamps
   - Send alerts on suspicious activity

4. **Multi-Factor Authentication**
   - Require MFA for admin login
   - Use TOTP (Google Authenticator) or WebAuthn

5. **Session Management**
   - Short session timeouts (15 minutes)
   - Automatic logout on inactivity
   - Secure session tokens (httpOnly cookies)

## Access Control

### Admin Credentials
**Default (Development Only):**
- Email: admin@geton.com
- Password: Admin1234!

**Production:**
Set via environment variables:
```bash
VITE_ADMIN_EMAIL=your-secure-email@domain.com
VITE_ADMIN_PASSWORD=Your-Very-Strong-Password-123!
```

### Permissions
Current admin has all permissions:
- role_switching
- view_all_users
- modify_users
- system_settings

## Recommended Security Measures

### 1. Network Security
```typescript
// Add IP whitelist check (server-side)
const ALLOWED_ADMIN_IPS = [
  '192.168.1.100', // Office IP
  '10.0.0.50',     // VPN IP
];

function isAllowedIP(requestIP: string): boolean {
  return ALLOWED_ADMIN_IPS.includes(requestIP);
}
```

### 2. Rate Limiting
```typescript
// Add rate limiting for admin login
const loginAttempts = new Map<string, number>();

function checkRateLimit(email: string): boolean {
  const attempts = loginAttempts.get(email) || 0;
  if (attempts >= 3) {
    // Block for 15 minutes
    return false;
  }
  loginAttempts.set(email, attempts + 1);
  return true;
}
```

### 3. Audit Logging
```typescript
// Log all admin actions
interface AdminAuditLog {
  timestamp: string;
  adminId: string;
  action: 'login' | 'logout' | 'role_switch' | 'modify_user';
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

function logAdminAction(log: AdminAuditLog): void {
  // Send to backend logging service
  console.log('[ADMIN_AUDIT]', log);
  // In production: send to CloudWatch, DataDog, etc.
}
```

## Testing Access

### For Developers
Admin access is available at: `#/admin-login` (hash-based routing)

Default credentials:
- Email: admin@geton.com
- Password: Admin1234!

### For QA Teams
Use test credentials (provided separately) to access admin mode for testing all user roles.

## Incident Response

If admin credentials are compromised:
1. Immediately rotate credentials
2. Review audit logs for unauthorized access
3. Check for data modifications
4. Notify security team
5. Update environment variables
6. Force logout all admin sessions

## Compliance

### GDPR Considerations
- Admin access to user data must be logged
- Users have right to know who accessed their data
- Implement data access audit trail

### UK Data Protection Act 2018
- Admin accounts require justification
- Access must be role-appropriate
- Regular access reviews required

## Admin Features

### Role Switching
The admin can impersonate any of the 4 user roles:
1. **Renter** - Test property browsing and matching
2. **Landlord** - Test property management and tenant selection
3. **Estate Agent** - Test property marketing and client management
4. **Management Agency** - Test maintenance and tenant issue handling

### Test Profiles
Each role has a pre-populated test profile with realistic data:
- **Test Renter**: test.renter@geton.com
- **Test Landlord**: test.landlord@geton.com
- **Test Estate Agent**: test.estateagent@geton.com
- **Test Management Agency**: test.managementagency@geton.com

All test profiles use the password: Test1234!

### Admin Mode Indicator
When impersonating a role, a purple banner appears at the top of the screen showing:
- Current role being tested
- "Exit Role" button to return to admin dashboard

## Technical Implementation

### Storage Keys
- `get-on-admin-profile` - Admin profile (singleton)
- `get-on-admin-session` - Current admin session data
- `get-on-admin-test-profiles` - Test user profiles for each role

### Authentication Flow
```
1. Navigate to #/admin-login
2. Enter admin credentials
3. System verifies against stored admin profile
4. On success, creates admin session
5. Shows role selector dashboard
6. Select role to impersonate
7. Loads test profile for that role
8. Shows admin mode indicator
9. Full access to app as that role
10. Exit role to return to dashboard
```

### Session Persistence
- Admin sessions persist across page reloads
- Uses Zustand with localStorage
- Cleared completely on logout

## Monitoring & Alerts

### What to Monitor
- Failed login attempts
- Role switch frequency
- Data modifications by admin
- Session duration
- Access patterns

### Alert Thresholds
- 3+ failed logins in 5 minutes
- Admin session > 8 hours
- Role switching > 20 times/hour
- Data modifications after hours

## Best Practices

1. **Never share admin credentials**
2. **Rotate passwords monthly**
3. **Use VPN when accessing admin features**
4. **Log out after each session**
5. **Monitor audit logs regularly**
6. **Report suspicious activity immediately**
7. **Use production credentials only in production**
8. **Never commit .env files to git**

## Future Enhancements

Planned security improvements:
1. Backend authentication API
2. JWT token-based auth
3. MFA support (TOTP/WebAuthn)
4. IP whitelisting
5. Rate limiting
6. Session timeout warnings
7. Audit log viewer
8. Real-time alert system
9. Role-based permissions (granular)
10. Secure credential rotation tool

---

**Last Updated**: 2025-11-13  
**Version**: 1.0.0  
**Status**: Development Only - Not Production Ready
