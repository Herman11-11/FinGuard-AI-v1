# FinGuard-AI Handoff

## Purpose
This document is meant to help the next developer or Codex session understand:
- what this project is
- what has already been built
- what is working now
- what is still rough or incomplete
- what direction we were intentionally moving in

The goal is to reduce re-discovery and avoid losing the design and product decisions that were made during development.

---

## 1. Product Summary

FinGuard-AI is a land-document security and verification system with:
- a React frontend
- a FastAPI backend
- SQLite for local persistence
- Firebase Google sign-in for primary app access
- Firebase custom claims for admin access
- a 3-person authorization flow for sensitive actions
- QR + fingerprinting + steganography for document trust workflows

The product direction has been:
- make the app feel like a premium government-grade system
- remove obvious mock/demo behavior where possible
- connect the UI to real backend flows
- support image and PDF document workflows
- gate admin/database access more seriously than normal user access

---

## 2. Current Working Mental Model

There are really **three different security/access layers** in this project:

### A. Normal App Access
- Controlled by Firebase Google sign-in on the frontend
- A user must sign in with Google before entering the app UI

### B. Admin Database Access
- Controlled by Firebase custom claims
- A signed-in Google user still does **not** become an admin automatically
- The backend checks the Firebase ID token and requires `admin=true`

### C. 3-Person Authorization
- Stored in the local app database
- Separate from Firebase auth
- Intended for sensitive document or admin access approval flows
- Uses locally seeded officers and approval requests

This separation is important. A lot of confusion earlier came from mixing these three systems together.

---

## 3. Current Architecture

### Frontend
- Framework: React + Vite
- Folder: `frontend/`
- Main UI shell: `frontend/src/App.jsx`
- Login screen: `frontend/src/components/Login.jsx`

### Backend
- Framework: FastAPI
- Folder: `backend/`
- Entry point: `backend/app/main.py`

### Database
- SQLite database file: `backend/finguard.db`

### Auth Stack
- Firebase Web SDK in frontend
- Firebase Admin SDK in backend
- Local SQLite users/officers still exist for some internal flows

---

## 4. Run Instructions

## Backend
From `backend/`:

```bash
source venv/bin/activate
python app/main.py
```

Expected local backend URL:

```text
http://localhost:8000
```

Health endpoints:

```text
http://localhost:8000/health
http://localhost:8000/api/health
```

## Frontend
From `frontend/`:

```bash
npm run dev -- --host localhost
```

Expected frontend URL:

```text
http://localhost:5173
```

Important:
- use `localhost`
- avoid `127.0.0.1` unless Firebase explicitly authorizes it

This matters because Google sign-in failed previously when the app was opened on `127.0.0.1`.

---

## 5. Firebase Setup

### Frontend Firebase config
File:
- `frontend/src/firebase.js`

It currently initializes:
- Firebase app
- Firebase Auth
- GoogleAuthProvider

Used for:
- Google sign-in
- session state
- admin token acquisition

### Backend Firebase Admin config
File:
- `backend/app/services/firebase_admin.py`

Service account file:
- `backend/keys/firebase-admin.json`

Used for:
- verifying Firebase ID tokens
- checking custom claims like `admin=true`
- supporting the admin-only backend endpoints

Security note:
- `backend/keys/firebase-admin.json` must not be committed or shared
- if it is exposed, revoke and regenerate it

---

## 6. Admin Claim Flow

Admin dashboard access is currently controlled by Firebase custom claims.

To grant admin access to a Google account:

```bash
cd backend
source venv/bin/activate
python app/set_admin_claim.py your-email@gmail.com
```

Important:
- after adding the claim, the user should sign out and sign back in
- otherwise the token may not refresh and the backend will still reject admin access

---

## 7. Current User Flow

### First app entry
1. User opens `http://localhost:5173`
2. App checks Firebase auth state
3. If no user is signed in, `Login.jsx` is shown
4. User clicks Google sign-in
5. On success, app enters the main shell

### Normal app use
User can access:
- Dashboard
- Register Document
- Verify Document
- 3-Person Auth

### Admin use
1. User signs in with Google
2. Frontend stores Firebase token
3. Admin page calls protected backend endpoints
4. Backend verifies token
5. Backend checks for `admin=true`
6. If claim is missing, access is denied

---

## 8. Current Backend Endpoints

This is the practical overview, not a perfect API spec.

### Health
- `GET /health`
- `GET /api/health`

### Stats
- `GET /api/stats`

### Documents
- `POST /api/documents/register`
- `POST /api/documents/verify`
- `POST /api/documents/verify-stego`
- `GET /api/documents/all`
- `GET /api/documents/search/{plot_number}`
- `GET /api/documents/pdf/{record_id}`

### Admin
- `GET /api/admin/documents`
  - requires Firebase admin claim

### Officer/Approval auth
- `GET /api/auth/officers`
- `POST /api/auth/request`
- `POST /api/auth/approve`

### Firebase admin self-check
- `GET /api/auth/firebase-me`

### Legacy local auth still present
- `POST /api/auth/login`
- `GET /api/auth/me`

Note:
- local auth still exists in the codebase
- Firebase auth is the main direction now
- local auth appears to be legacy/secondary and may eventually be removed or reduced

---

## 9. Key Frontend Files

- `frontend/src/App.jsx`
  - main app shell
  - language toggle
  - theme toggle
  - Firebase auth state gate
  - health check for system status
  - sidebar layout

- `frontend/src/components/Login.jsx`
  - dedicated login page
  - Google sign-in button
  - premium government-style visual treatment

- `frontend/src/components/Dashboard.jsx`
  - stat cards
  - recent activity
  - system status UI

- `frontend/src/components/DocumentRegistration.jsx`
  - uploads a file + metadata
  - supports image and PDF preview
  - downloads generated PDF output

- `frontend/src/components/DocumentVerification.jsx`
  - upload or scan verification flow
  - supports image preview
  - now also supports PDF preview
  - includes camera mode

- `frontend/src/components/ThreePersonAuth.jsx`
  - officer-driven approval flow

- `frontend/src/components/AdminDocuments.jsx`
  - admin-only database view
  - intended to show stored document data

- `frontend/src/firebase.js`
  - Firebase frontend config and exports

- `frontend/src/index.css`
  - most visual polish lives here
  - includes login styling, dashboard polish, dark mode treatment, premium accents

---

## 10. Key Backend Files

- `backend/app/main.py`
  - app startup
  - router registration
  - CORS
  - health endpoints

- `backend/app/api/documents.py`
  - document registration
  - verification
  - PDF generation
  - admin DB endpoint
  - steganography verification endpoint

- `backend/app/api/auth.py`
  - officer request/approval flow
  - Firebase admin verification helper
  - legacy local auth endpoints

- `backend/app/api/stats.py`
  - dashboard stats and recent activity

- `backend/app/models/database.py`
  - SQLAlchemy models
  - session and DB setup
  - encrypted/decrypted data behavior

- `backend/app/services/firebase_admin.py`
  - initializes Firebase Admin SDK
  - verifies Firebase ID tokens

- `backend/app/services/auth_token.py`
  - token helper for legacy local auth

- `backend/app/services/pdf_service.py`
  - PDF generation logic

- `backend/app/services/qr_service.py`
  - QR generation

- `backend/app/services/steganography.py`
  - embed/extract hidden fingerprint data in supported images

---

## 11. Current Database/Seed Setup

### Seed admin user
File:
- `backend/app/seed_admin.py`

Creates:
- email: `admin@finguard.ai`
- password: `admin123`

This is for the legacy local auth path, not the Firebase custom-claim path.

### Seed officers
File:
- `backend/app/seed_officers.py`

Creates 3 officers:
- Officer Sarah / `sarah123`
- Officer Michael / `michael123`
- Supervisor David / `david123`

These are used by the 3-person approval flow.

Run seeds from `backend/`:

```bash
source venv/bin/activate
python app/seed_officers.py
python app/seed_admin.py
```

---

## 12. Current Document Workflow

### Registration
When a document is registered:
- file content is read
- document metadata is collected
- metadata hash is created
- file hash is created
- combined fingerprint is created
- DB record is stored
- QR data is generated
- mini QR is generated
- if file is an image, steganography may hide fingerprint data inside it
- if needed, PDF output can be generated later

### Verification
Current verification logic:
1. compute exact uploaded file hash
2. try to find matching document by file hash
3. if not found and file is an image, try steganographic extraction
4. if record is found, return authentic
5. otherwise return not authentic

Important limitation:
- a generated PDF or a transformed/scanned version of the original file may not hash-match the original upload
- so “forged” does not always mean malicious tampering
- it can also mean “different file representation”

This is one of the bigger product logic gaps still remaining.

---

## 13. PDF Support Status

This was a recent pain point.

### What was wrong before
- PDFs could be selected
- but the UI only previewed images
- so it looked like the PDF was not loaded

### What was fixed
- both registration and verification now visibly support PDFs
- PDF uploads can preview inline instead of appearing blank

Relevant files:
- `frontend/src/components/DocumentRegistration.jsx`
- `frontend/src/components/DocumentVerification.jsx`

### What is still not fully solved
- verifying a PDF semantically is still limited by backend logic
- the current backend still mainly trusts exact file hash or image steganography
- PDF verification may need its own strategy later

---

## 14. Current UI/Design Direction

The UI direction we were intentionally aiming for:
- premium
- government-official
- not flashy
- not “AI-generated” looking
- balanced green/white palette
- subtle premium accents
- cleaner typography and spacing

Specific design work already done:
- improved dashboard styling
- added dark mode
- improved admin page styling
- improved login page styling
- refined card effects and reduced overdone glows
- made the system feel more human-designed and less templated

Login page specifically:
- was moved into its own file
- uses a premium government look
- now should remain connected to real Google auth, not mock behavior

---

## 15. Major Issues Already Resolved

These were recurring blockers and are worth remembering:

### Import path issues
- many modules originally mixed `Services` vs `services`
- several backend files had broken import paths
- those were progressively corrected

### HTTP vs HTTPS local mismatch
- frontend and backend were temporarily split across HTTP/HTTPS
- this created cert issues and mixed-content issues
- local dev was standardized back to HTTP

### Vite proxy issues
- frontend was sometimes calling backend directly with hardcoded URLs
- now the intended dev setup is Vite proxy to `http://localhost:8000`

### Firebase domain issues
- Google sign-in failed when app was opened on `127.0.0.1`
- `localhost` is the safe domain for local development unless Firebase auth settings are updated

### Schema drift
- local SQLite schema got out of sync with model changes at one point
- deleting/recreating `backend/finguard.db` was used as a development reset

### PDF UX confusion
- fixed frontend preview issue for PDFs

---

## 16. Current Rough Edges / Known Issues

These are the most important things the next person should be aware of.

### 1. Mixed auth systems still coexist
There is:
- Firebase auth
- local SQLite user auth
- officer approval auth

This is functional but conceptually messy.

### 2. `documents.py` has cleanup debt
At the time of writing:
- there is duplicated `router = APIRouter()` declaration
- the file has grown into a multi-responsibility module
- it should eventually be split/refactored

### 3. PDF verification semantics are incomplete
- preview works
- backend verification logic for PDFs is still weaker than for original uploads/images

### 4. Admin flow and 3-person flow are separate
- this is intentional for now
- but the UX and architecture may still need refinement depending on the desired security model

### 5. Dashboard stats are simple
- `verifiedToday` is currently based on document creation count for today
- `fraudulentDetected` depends on `AccessLog.status == "fraudulent"`
- this may not yet reflect full real-world product meaning

### 6. DB migrations are not formalized
- no proper migration workflow has been established yet
- local DB recreation has been used in development

---

## 17. What We Were Trying To Achieve

This section matters because it captures the plan, not just the files.

### Product goals
- secure land document handling
- strong trust cues in the UI
- real login, not mock login
- stronger admin protection
- visible, useful verification flows
- realistic government-style presentation

### Technical goals
- move away from mock data
- connect frontend to backend endpoints properly
- use Firebase Google auth for system entry
- use Firebase custom claims for admin gating
- support both images and PDFs in registration/verification
- keep local development simple enough to run on one machine

### UX goals
- make the app feel production-minded
- reduce fake-looking icons/effects
- keep green as the identity color, but in a refined way
- make login feel official and trustworthy

---

## 18. Suggested Near-Term Plan

If development continues from here, this is the clean next sequence:

### Phase 1: Stabilize
- clean `backend/app/api/documents.py`
- decide whether local auth should remain or be retired
- confirm all admin page behaviors against the new Firebase flow
- verify that logout behavior is consistent across app and admin view

### Phase 2: Tighten verification logic
- define proper verification behavior for PDFs
- decide whether verification should use:
  - record ID
  - QR payload
  - PDF metadata
  - hidden signature/fingerprint
  - exact file hash only

### Phase 3: Improve data model
- decide whether documents should belong to signed-in Firebase users
- add ownership relationship if needed
- introduce proper migrations

### Phase 4: Production-readiness
- externalize secrets and env config properly
- add error handling and logging cleanup
- audit endpoints for permission boundaries
- deploy frontend/backend with stable URLs

---

## 19. Fast Troubleshooting Guide

### If Google sign-in fails
Check:
- app opened on `http://localhost:5173`
- Firebase Google provider enabled
- `localhost` is in Firebase authorized domains

### If frontend shows proxy `ECONNREFUSED`
Check:
- backend is running on `http://localhost:8000`

### If backend says port 8000 is already in use
Check:
- another backend process is still running

### If admin access fails after adding claim
Check:
- user signed out and signed back in
- token refreshed

### If PDF appears “missing”
Check:
- UI preview area
- file selected successfully
- preview support is present in registration/verification components

### If DB errors mention missing columns
Check:
- local DB schema drift
- in development, recreating `backend/finguard.db` may be the fastest reset if data is disposable

---

## 20. Safe Transfer To Another Machine or Account

To continue this exact project elsewhere, move:
- the repo itself
- `backend/keys/firebase-admin.json`
- Firebase frontend config in `frontend/src/firebase.js`
- `backend/finguard.db` if you want the same local records

Also remember:
- the new Google account will need admin claim if it needs admin access
- local `localhost` setup matters for Firebase sign-in

---

## 21. Final Notes For The Next Person

This project is beyond pure prototype stage, but it still has some layered decisions from iterative development.

The safest mindset is:
- do not assume every auth path is still equally important
- Firebase Google sign-in is now the main front door
- Firebase custom claims are now the intended admin gate
- the officer approval system is a separate business/security flow
- PDF UX is better now, but PDF verification logic still needs deliberate product decisions

If you are picking this up fresh, start by validating:
1. login
2. dashboard
3. document registration
4. document verification for image and PDF
5. admin access with an admin-claim account
6. officer approval flow

That will tell you very quickly whether the local environment and app logic are aligned.
