# 📶 Tanzania Wi-Fi Billing & Hotspot Management System

An automated, carrier-grade Wi-Fi Hotspot Billing, Captive Portal, and Voucher Management system engineered for the Tanzanian telecommunications market. Seamlessly integrates **MikroTik RouterOS**, **Tanzanian Mobile Money (M-Pesa, Tigo Pesa, Airtel Money, Halopesa)** via **AzamPay & Selcom**, and physical scratch-voucher networks.

---

## 🌟 Key Features

- **🇹🇿 Tailored for Tanzania:**
  - Full bilingual localization: **Swahili (Kiswahili)** & **English**.
  - Native support for Tanzanian mobile money networks (Vodacom M-Pesa, Tigo Pesa / Yas, Airtel Money, Halopesa).
  - Pre-configured Tanzanian Shilling (TZS) packages (500 TZS, 1,000 TZS, 2,000 TZS, Weekly & Monthly).
- **🚀 Captive Portal Engine:**
  - Ultra-fast, lightweight responsive mobile-first UI (Next.js 14, Tailwind CSS).
  - Automated browser popup trigger (RFC 8952 / Android & iOS Captive Network Assistant).
  - MAC address randomization protection using resilient token and phone-based session recovery.
- **💳 Automated USSD Push / STK Checkout:**
  - User chooses a bundle, enters phone number $\rightarrow$ gets instant USSD PIN prompt on phone $\rightarrow$ internet turns on automatically upon payment confirmation.
- **🎫 Physical Voucher & Agent POS Module:**
  - Generate, batch export, and print thermal receipt vouchers (58mm/80mm) for neighborhood kiosks (*maduka ya mangi, vibanda, stationery*).
  - Agent commission tracking (10–15% margin).
- **📡 MikroTik RouterOS Gateway Driver:**
  - Direct RouterOS v7 REST API and RADIUS support.
  - Per-Connection Queue (PCQ) dynamic bandwidth shaping.
  - Walled garden automation for payment endpoints.
- **⚖️ Regulatory & TCRA Compliance:**
  - Lawful data retention and KYC session audit logs (MAC address, assigned IP, phone number, timestamps) complying with the *Cybercrimes Act (2015)* and *EPOCA*.

---

## 🏗️ System Architecture

```
[End User Device] ---> [Wi-Fi AP (UniFi/Omada)] ---> [MikroTik Gateway (RouterOS v7)]
                                                                |
                                             +------------------+------------------+
                                             |                                     |
                                  [Captive Portal Web]                  [Tanzanian Payment APIs]
                                  - Next.js 14 Fullstack                - AzamPay / Selcom
                                  - Swahili & English UI                - M-Pesa / Tigo / Airtel
                                  - Voucher Validator                   - Instant USSD Push Webhook
```

---

## 📂 Repository Structure

```
WifiBillingBusinessSystem/
├── docs/
│   ├── ARCHITECTURE_AND_ROADMAP.md             # Detailed technical architecture & roadmap
│   └── TANZANIA_WIFI_BUSINESS_EXECUTION_MANUAL.md # Ground business guide, hardware BOM & runbook
├── src/
│   ├── app/                                    # Next.js App Router (Portal, Admin, Diagnostics, APIs)
│   │   ├── api/                                # Backend API routes (payments, vouchers, mikrotik, admin)
│   │   ├── admin/                              # POS revenue analytics & thermal voucher printing
│   │   └── diagnostics/                        # MikroTik live session & walled garden controls
│   ├── components/                             # Reusable UI components
│   ├── lib/                                    # Core drivers (MikroTik, AzamPay, Selcom, Database)
│   └── locales/                                # Swahili (sw) & English (en) dictionary strings
├── public/                                     # Static assets, branding, and icons
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 📖 Essential Documentation
- **[Business & Field Execution Manual](docs/TANZANIA_WIFI_BUSINESS_EXECUTION_MANUAL.md):** Complete guide to site selection (Hostels, Stendi, Masoko), hardware BOM (~845,000 TZS), TANESCO mini-UPS power resilience, AzamPay/Selcom onboarding, "Duka la Mangi" voucher distribution, and 30-day pilot runbook.
- **[System Architecture & Technical Roadmap](docs/ARCHITECTURE_AND_ROADMAP.md):** Fullstack technical specification, RouterOS v7 driver design, and TCRA compliance guidelines.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node v24 LTS)
- MikroTik Router with RouterOS v7.x (or simulated sandbox)
- AzamPay or Selcom Merchant credentials (or Mock Sandbox mode)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Seifj/WifiBillingBusinessSystem.git
cd WifiBillingBusinessSystem
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your gateway and router configurations:
```env
# Database
DATABASE_URL="file:./dev.db"

# MikroTik RouterOS Credentials
MIKROTIK_HOST="192.168.88.1"
MIKROTIK_PORT="8728"
MIKROTIK_USER="admin"
MIKROTIK_PASSWORD="your-strong-password"

# AzamPay / Selcom Payment Gateway
PAYMENT_GATEWAY_PROVIDER="azampay" # or "selcom" / "mock"
AZAMPAY_APP_NAME="MtaaWiFi"
AZAMPAY_CLIENT_ID="your_client_id"
AZAMPAY_CLIENT_SECRET="your_client_secret"
AZAMPAY_API_KEY="your_api_key"
AZAMPAY_ENV="sandbox" # "sandbox" or "production"

# App Configuration
NEXT_PUBLIC_APP_NAME="MtaaWiFi Tanzania"
NEXT_PUBLIC_DEFAULT_CURRENCY="TZS"
NEXT_PUBLIC_DEFAULT_LOCALE="sw"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the Captive Portal.

---

## 📜 Business Plans & Pricing Matrix

| Package Name | Duration / Quota | Typical Price (TZS) | Speed / Policy |
| :--- | :--- | :--- | :--- |
| **Kifurushi cha Saa 1** | 1 Hour Unlimited | 500 TZS | 3 Mbps burst |
| **Kifurushi cha Saa 3** | 3 Hours Unlimited | 1,000 TZS | 3 Mbps burst |
| **Kifurushi cha Siku (24h)** | 24 Hours Unlimited | 2,000 TZS | 4 Mbps burst |
| **Kifurushi cha Wiki** | 7 Days Unlimited | 7,000 TZS | 5 Mbps burst |
| **Kifurushi cha Mwezi** | 30 Days | 25,000 TZS | 5 Mbps burst (FUP applied) |

---

## 📄 License
Licensed under the [MIT License](LICENSE).
