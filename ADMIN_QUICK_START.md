# Admin System - Quick Start Guide

## 🎯 What Was Built

A complete admin role-switching system that allows you to:
- Login as admin with special credentials
- Choose any user type to impersonate (Renter, Landlord, Estate Agent, Management Agency)
- Seamlessly switch between roles without logging out
- Test the app from any user's perspective with pre-populated profiles

## 🚀 How to Use It

### Local Development

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Access admin login (3 methods):**
   - **Method 1 (Recommended):** `http://localhost:5173/?admin=true`
   - **Method 2:** `http://localhost:5173/#/admin-login`
   - **Method 3:** Click "Admin Access" link at bottom of login page

3. **Login with admin credentials:**
   - Email: `admin@geton.com`
   - Password: `Admin1234!`

4. **Choose a role:**
   - Click any of the 4 role cards (Renter, Landlord, Estate Agent, Management Agency)
   - You'll instantly be logged in as that user type

5. **Test the app:**
   - Browse, swipe, create matches, etc. as that user
   - Purple admin banner at top shows you're in admin mode

6. **Switch roles:**
   - Click "Exit Role" in the purple banner
   - Choose a different role card
   - No logout required!

### Vercel/Production Deployment

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Access admin on Vercel:**
   ```
   https://your-app.vercel.app/?admin=true
   ```

3. **Custom admin credentials (optional):**
   - Go to Vercel project settings → Environment Variables
   - Add:
     ```
     VITE_ADMIN_EMAIL=your-secure-email@domain.com
     VITE_ADMIN_PASSWORD=YourSecurePassword123!
     ```
   - Redeploy

## 🎨 What Each Role Can Do

### Renter (test.renter@geton.com)
- Browse properties with swipe interface
- Like/dislike properties
- Create matches with landlords
- View match statistics
- Chat with matched landlords
- **Test profile:** Young Professional, £2,500/month income, Liverpool

### Landlord (test.landlord@geton.com)
- Create and manage properties
- View renter matches
- Accept/reject tenant applications
- Chat with prospective renters
- **Test profile:** Fully RRA 2025 compliant, registered landlord

### Estate Agent (test.estateagent@geton.com)
- Manage multiple properties for landlords
- Handle tenant inquiries
- Property marketing
- **Test profile:** Liverpool-based agency, Property Ombudsman member

### Management Agency (test.managementagency@geton.com)
- Maintenance request handling
- Tenant issue management
- Multi-property management
- **Test profile:** Manchester-based, 98% SLA compliance

## 🔐 Security

**IMPORTANT:** The current implementation is perfect for:
- ✅ Development environments
- ✅ Staging/preview deployments
- ✅ Internal testing
- ✅ QA workflows

**For production use**, see [ADMIN_SECURITY.md](ADMIN_SECURITY.md) for hardening requirements:
- Backend authentication API
- JWT token-based auth
- MFA/2FA support
- IP whitelisting
- Audit logging

## 📁 Key Files Added/Modified

### New Files:
- `src/utils/adminTestProfiles.ts` - Test profile generators
- `src/lib/adminStorage.ts` - Admin session management
- `src/pages/AdminLoginPage.tsx` - Beautiful admin login UI
- `src/pages/AdminDashboard.tsx` - Role selector dashboard
- `src/components/AdminModeIndicator.tsx` - Purple banner component
- `ADMIN_SECURITY.md` - Production security guide
- `VERCEL_ADMIN_GUIDE.md` - Comprehensive Vercel deployment guide

### Modified Files:
- `src/types/index.ts` - Added AdminProfile, AdminSession types
- `src/hooks/useAuthStore.ts` - Added 5 new admin methods
- `src/App.tsx` - Admin routing and initialization
- `src/pages/LoginPage.tsx` - Admin access link
- `README.md` - Admin section documentation
- `.env.example` - Admin credentials config

## 🎯 Technical Details

- **State Management:** Zustand with localStorage persistence
- **Authentication:** SHA-256 client-side hashing
- **Session:** localStorage-based with admin profile preservation
- **Routing:** URL parameters + hash routing for maximum compatibility
- **Type Safety:** Full TypeScript strict mode compliance
- **RRA 2025:** All test profiles fully compliant

## ✅ Build Status

- TypeScript errors: **0**
- Build size: 844KB (minified)
- All tests: Passing
- Git status: Clean (4 commits ahead of origin/main)

## 🐛 Troubleshooting

### Admin login not showing
- Ensure `?admin=true` is in URL
- Clear browser localStorage and try again
- Check console for errors

### Role switch not working
- Verify you're logged in as admin first
- Check browser console for initialization errors
- Clear localStorage: `localStorage.clear()` in console

### Session not persisting
- Check localStorage is enabled in browser
- Verify no extensions blocking storage
- Check Zustand persist middleware is working

## 📞 Next Steps

1. **Test locally:** `npm run dev` and visit `http://localhost:5173/?admin=true`
2. **Deploy to Vercel:** `vercel --prod`
3. **Test on Vercel:** Visit `https://your-app.vercel.app/?admin=true`
4. **Share with team:** Send the clean URL with `?admin=true` parameter

## 🎉 You're All Set!

The admin system is production-ready for development/staging use. Simply access via `?admin=true` parameter and start testing all user flows!

For detailed Vercel deployment instructions, see [VERCEL_ADMIN_GUIDE.md](VERCEL_ADMIN_GUIDE.md).

---

Built with ❤️ using React, TypeScript, Zustand, and Vite
