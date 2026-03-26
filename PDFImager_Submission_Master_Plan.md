# PDF Imager — App Store & Google Play Submission Master Plan

This document consolidates all work completed and requirements met during **Phase 2 (Compliance)**, **Phase 3 (ASO)**, and **Phase 4 (Technical Audit)** for the PDF Imager application.

---

## Phase 2: App Compliance & Submission Readiness

### 1. Subscription & Onboarding Localization
- **Status:** ✅ COMPLETED
- **Details:** Localized all UI elements on the entry language selector, primary paywall, and settings screens.
- **Files:** `app/onboarding-language.tsx`, `app/paywall.tsx`, `app/(tabs)/settings.tsx`
- **Languages:** 9 Languages (English, French, Portuguese, Spanish, German, Arabic, Chinese, Russian, Japanese).

### 2. Legal Compliance Integration
- **Status:** ✅ COMPLETED
- **Details:** Added mandatory clickable links to **Terms of Service** and **Privacy Policy** in the footer of the onboarding and paywall screens.
- **Hosted Docs:** Created standalone HTML files with language switchers at `/docs/terms/` and `/docs/privacy/`.

### 3. Subscription Management
- **Status:** ✅ COMPLETED
- **Details:** Added localized "Manage Subscription" row in Settings that deep-links to native store management:
  - **iOS:** `https://apps.apple.com/account/subscriptions`
  - **Android:** `https://play.google.com/store/account/subscriptions`

### 4. EULA & Legal Content Enrichment
- **Status:** ✅ COMPLETED
- **Details:** Enriched Terms of Service with mandatory Billing & Cancellation clauses:
  - **Auto-Renewal:** Clear 24-hour renewal window billing statement.
  - **3-Doc Limit:** Clear notification of the usage cap for free users.
  - **Cancellation:** Instructions for managing via store settings.

### 5. Robust Data Reset (Account Deletion Requirement)
- **Status:** ✅ COMPLETED
- **Details:** Implemented `resetAllData` in `SubscriptionContext.tsx`. Performs a full wipe of:
  - Local conversion directory (`pdfconverter/`).
  - Usage analytics (`analytics.json`).
  - Reactive app state (resetting trial status and usage count).

---

## Phase 3: App Store Optimization (ASO)

### 1. Store Identity
- **Optimized Title:** PDF Imager — PDF to Image & Word
- **Subtitle:** Professional PDF conversion for images, documents, and vice versa.

### 2. Primary Keywords (ASO targets)
- **Keywords:** `pdf converter,image to pdf,pdf to word,jpg to pdf,word to pdf,extract text,ocr,batch converter,pdf scanner`

---

## Phase 4: Technical Submission Requirements

### 1. iOS Usage Descriptions (Info.plist)
- **Status:** ✅ IMPLEMENTED in `app.json`
- **NSPhotoLibraryUsageDescription:** "PDF Imager needs access to your gallery so you can convert images into high-quality PDF documents."
- **NSCameraUsageDescription:** "Access to the camera allows you to scan documents directly into PDFs."
- **NSUserTrackingUsageDescription:** "This identifier will be used to deliver personalized ads and content to you."

### 2. iOS 17+ Privacy Manifest
- **Status:** ✅ IMPLEMENTED in `app.json`
- **Details:** Included mandatory Privacy Types and Reasons:
  - `NSPrivacyAccessedAPITypeUserDefaults`: Reason `CA92.1` (Required for persistent settings).
  - `NSPrivacyAccessedAPITypeFileTimestamp`: Reason `DDA9.1` (Required for file system management).

---

## Final Verification Checklist

- [x] All 9 locale definitions verified.
- [x] "Manage Subscription" handles platform-specific deep links.
- [x] Legal footer links added to all entry gates.
- [x] `resetAllData` verified to clear local storage and cache.
- [x] `app.json` contains valid iOS Privacy Manifest and Usage Descriptions.
- [x] Native Splash journey (Splash -> Language -> Paywall) stabilized.

---
**Next Step:** Execute binary build via `eas build -p ios` and prepare for submission to App Store Connect.
