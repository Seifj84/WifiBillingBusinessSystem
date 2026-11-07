# Tanzanian Wi-Fi Billing & Hotspot Management System
## System Architecture & Technical Implementation Roadmap

### 1. Project Overview
This project is an automated, carrier-grade Wi-Fi Hotspot Billing and Captive Portal system engineered specifically for the Tanzanian telecommunications market. It enables hotspot operators, ISPs, university campuses, markets, and hospitality venues to monetize broadband internet access through frictionless local mobile money integration and physical voucher distribution.

---

### 2. High-Level Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    END-USER CLIENT                                      |
|            (Android / iOS / Windows / macOS connects to Hotspot Wi-Fi SSID)             |
+-----------------------------------------------------------------------------------------+
                                             |
                                    [HTTP Captive Redirection]
                                             v
+-----------------------------------------------------------------------------------------+
|                             HOTSPOT GATEWAY / EDGE NETWORK                              |
|          MikroTik RouterBOARD (hAP ax3 / RB4011 / RB5009 / CCR RouterOS v7)             |
|   - Hotspot Engine & NAT                                                                |
|   - Per-Connection Queuing (PCQ) Dynamic Bandwidth Shaping                              |
|   - Walled Garden (Allows captive portal domain, payment gateway APIs & assets)         |
+-----------------------------------------------------------------------------------------+
                                             |
                                  [API / Webhook / RADIUS]
                                             v
+-----------------------------------------------------------------------------------------+
|                             WIFI BILLING & PORTAL SERVER                                |
|   Next.js 14 / TypeScript (App Router, Tailwind CSS, API Handlers)                      |
|                                                                                         |
|   1. Captive Portal UI (Swahili & English)                                              |
|      - Package Selection (Time-based & Volume-based in TZS)                             |
|      - Mobile Money Instant Checkout (M-Pesa, Tigo Pesa, Airtel, Halopesa)              |
|      - Physical Voucher Scratch-Code Redemption                                         |
|      - Active Session Status & Data/Time Remaining Dashboard                            |
|                                                                                         |
|   2. Payment Orchestration Service                                                      |
|      - AzamPay / Selcom APIGW / Beem Africa integration                                 |
|      - STK / USSD Push dispatch                                                         |
|      - Asynchronous Webhook verification & transaction idempotency                      |
|                                                                                         |
|   3. RouterOS / RADIUS Controller                                                       |
|      - MikroTik REST API / RouterOS API Client                                          |
|      - User creation, MAC binding, session authorization, and active kick/disconnect    |
|                                                                                         |
|   4. Administrative Dashboard & Agent POS                                               |
|      - Real-time revenue analytics (TZS), active users, bandwidth charts                |
|      - Batch Voucher Generation (with printable thermal paper/scratch card layout)      |
|      - Reseller agent commission management (10-15% kiosk margins)                      |
|      - TCRA & Cybercrimes Act statutory user audit & connection logs                     |
+-----------------------------------------------------------------------------------------+
```

---

### 3. Implementation Phases

#### Phase 1: Captive Portal & Web Application Core (Completed)
- [x] Next.js 14 + Tailwind CSS responsive portal application.
- [x] Bilingual localization (Kiswahili & English).
- [x] Package catalog with Tanzanian pricing tiers (500 TZS 1hr, 1,000 TZS 3hrs, 2,000 TZS 24hrs, etc.).
- [x] Mobile number validator for Tanzanian telecom prefixes (Vodacom 074/075/076, Tigo/Yas 065/067/071, Airtel 068/069/078, Halotel 062).
- [x] Voucher redemption modal and verification engine.
- [x] Active session status checker.

#### Phase 2: Tanzanian Payment Gateways Integration (Completed)
- [x] Unified `IPaymentGateway` abstraction layer and gateway factory (`src/lib/payments/`).
- [x] **AzamPay Gateway Driver:** Token caching, MNO USSD Push (`/azampay/mno/checkout`), and webhook verification.
- [x] **Selcom APIGW Driver:** HMAC-SHA256 signature generation, order creation (`/v1/checkout/create-order-minimal`), and callback verification.
- [x] **Mock Gateway Driver:** Sandbox simulation with auto-settlement and test failure triggers.
- [x] **Webhook Processing & Idempotency:** Guarding against double-spend/duplicate session activations on repeated telco retries (`/api/payments/webhook`).
- [x] Manual transaction verification fallback endpoint (`/api/payments/verify`).

#### Phase 3: MikroTik RouterOS Gateway Driver (Completed)
- [x] MikroTik REST API (RouterOS v7) connection manager (`src/lib/mikrotik/client.ts`).
- [x] High-fidelity RouterOS simulator (`src/lib/mikrotik/mock.ts`) for local development without hardware.
- [x] Hotspot user add, authenticate, and session expiration trigger (`provisionHotspotAccess`).
- [x] Bandwidth Profile sync (`pkg-tz-1hr`, `pkg-tz-3hr` with rate-limits e.g., `1M/3M`, `2M/4M`, `2M/5M`).
- [x] Walled Garden automated rules builder (whitelisting AzamPay, Selcom, Beem, Apple/Android CNA probes).
- [x] Router diagnostics and active session manager UI (`/diagnostics`).

#### Phase 4: Admin Dashboard, POS & Voucher Printing (Completed)
- [x] Admin dashboard with financial metrics (TZS) & telecom settlement breakdown (`/admin`).
- [x] Cryptographically randomized batch voucher generator (`src/lib/voucher-generator.ts`).
- [x] Agent commission margin calculator (e.g., 10% kiosk profit margins for neighborhood retailers).
- [x] Thermal receipt printer layout (58mm / 80mm ESC/POS compatible & A4 printable grid) (`/admin/vouchers/print`).
- [x] TCRA Compliance & statutory session audit log exporter (CSV export complying with Cybercrimes Act 2015 & EPOCA) (`/api/admin/tcra-export`).
