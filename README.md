# ✈️ Aero Map & Shop

> **HackSussex 2026** — Pre-flight airport shopping, gamified.

The main idea for this app was that it will be full mobile game made using unity which will allow passengers to do shopping around the airport through their virtual persona while they wait for boarding at the gate, the checkout process closes 15 minutes before boarding .

Aero Map & Shop lets airport passengers walk a **3D virtual terminal** on their phone or laptop, browse real gate-area shops, add items to a cart, and have them delivered to their seat before boarding — all without leaving the gate.

---

## 🎮 What It Is

A browser-based mini-RPG set inside an airport terminal. After logging in with your boarding pass (I've got a list of boarding passes as a json file that can be used), you control a blocky 3D character roaming the map. Walk into a store, pick your items, and checkout. Your order is queued for seat delivery. Players can also use navigation feature to find their way to a store, gate, washrooms or any other landmark.

---

## ✨ Features

| Feature | Details |
|---|---|
| **3D Terminal Map** | Three.js scene with stores, gates, lounges, seating areas and atmospheric lighting |
| **Character Movement** | WASD / arrow keys on desktop · Virtual joystick on mobile |
| **Touch Camera** | One-finger drag rotates the camera on any touchscreen |
| **Boarding Pass Login** | Auth0 (Google/email) + PNR verification loads your real flight data |
| **In-Store Shopping** | Walk into a shop → modal opens with full product list |
| **Quantity Controls** | `− N +` buttons to adjust quantities directly in the store |
| **In-Store Checkout** | Checkout button inside every shop — no need to leave the modal |
| **Payment Picker** | Card · Google Pay · PayPal · Apple Pay (all simulated) |
| **Boarding Timer** | Live countdown; checkout locks 15 min before boarding |
| **Navigate** | Built-in waypoint navigator draws a path to any zone |
| **Fully Mobile** | Responsive HUD, bottom-sheet modals, touch controls |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- An Auth0 account (free tier)

### Install & Run

```bash
# 1. Clone / unzip the project
cd "Aero Map and shop"

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Fill in AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, FLASK_SECRET_KEY

# 4. Run
python app.py
```

Open **http://localhost:5000** in your browser.

### Auth0 Setup (quick)
1. Create a **Regular Web App** in Auth0
2. Set **Allowed Callback URLs** → `http://localhost:5000/callback`
3. Set **Allowed Logout URLs** → `http://localhost:5000`
4. Copy Domain, Client ID, and Client Secret into `.env`

---

## 🗺️ User Flow

```
Landing page  →  Login (Auth0)  →  Enter PNR  →  3D Terminal
                                                      │
                                              Walk to a store
                                                      │
                                         Shop modal opens (−/+)
                                                      │
                                              Checkout → Payment
                                                      │
                                         Order confirmation page
                                      "Delivering to Seat 14A ✈️"
```

### Demo PNRs (no real booking needed)
`LG3KZP` · `QZ8P9C` · `H7L4TN` · `R2M7FX` · `C9V3JD`

---

## 🏪 Stores & Menu

| Store | Items |
|---|---|
| **WHSmith** | Sandwich £4.50 · Water £1.99 · Magazine £3.99 |
| **Pret A Manger** | Croissant £2.50 · Coffee £3.20 · Fruit Salad £3.80 |
| **Duty Free** | Perfume £35.00 · Chocolates £8.99 · Sunglasses £19.99 |
| **Boots** | Lip Balm £2.99 · Travel Pillow £12.99 · Earbuds £14.99 |
| **Coffee Shop** | Latte £3.50 · Muffin £2.00 · Hot Chocolate £3.00 |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python · Flask · Authlib |
| Auth | Auth0 (OpenID Connect) |
| Frontend | Three.js r128 (3D engine) · Vanilla JS · Jinja2 |
| Styling | Vanilla CSS · Google Fonts (Inter) · glassmorphism |
| Data | In-memory Python dicts (MVP, no database) |
| Payments | Fully simulated (mock checkout) |

---

## 📁 Project Structure

```
Aero Map and shop/
├── app.py              # Flask app, routes, Auth0, order API
├── .env                # Secrets (not committed)
├── .env.example        # Template
├── requirements.txt
├── Assets/
│   └── Tickets.json    # Demo boarding pass data
├── static/
│   ├── game.js         # Three.js scene + all game logic
│   ├── style.css       # Dark navy/blue theme + responsive CSS
│   └── logo.jpg
└── templates/
    ├── index.html      # Landing page
    ├── boarding.html   # PNR entry
    ├── game.html       # 3D terminal (main page)
    └── orders.html     # Order confirmation
```

---

## ⌨️ Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | WASD / Arrow keys | Virtual joystick (bottom-left) |
| Rotate camera | Mouse drag | One-finger drag |
| Enter store | Walk into zone → Enter | Walk into zone → Tap prompt |
| Close modal | Esc / ✕ button | Tap backdrop or ✕ |
| Navigate | Navigate button → pick zone | Same |

---

## Constraints

- No real payments are processed
- No database — orders live in memory and reset on server restart
- Auth0 free tier only
- No multiplayer

---

*Built for HackSussex 2026 .*
