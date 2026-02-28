
---

## PHASE 1 — Auth0 Setup (Hour 1)

### Steps:
1. Go to auth0.com → sign up free → Create Application → "Regular Web App"
2. Set Allowed Callback URL: `http://localhost:5000/callback`
3. Set Allowed Logout URL: `http://localhost:5000`
4. Copy Domain, Client ID, Client Secret → paste into `.env`

### .env



---

## PHASE 1 — Auth0 Setup (Hour 1)

### Steps:
1. Go to auth0.com → sign up free → Create Application → "Regular Web App"
2. Set Allowed Callback URL: `http://localhost:5000/callback`
3. Set Allowed Logout URL: `http://localhost:5000`
4. Copy Domain, Client ID, Client Secret → paste into `.env`

### .env

---

## PHASE 2 — Flask Backend (Hour 2)

### app.py — full skeleton

```python
from flask import Flask, redirect, render_template, session, url_for, request, jsonify
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
import os, json

load_dotenv()
app = Flask(__name__)
app.secret_key = os.getenv("APP_SECRET_KEY")

oauth = OAuth(app)
auth0 = oauth.register(
    "auth0",
    client_id=os.getenv("AUTH0_CLIENT_ID"),
    client_secret=os.getenv("AUTH0_CLIENT_SECRET"),
    client_kwargs={"scope": "openid profile email"},
    server_metadata_url=f'https://{os.getenv("AUTH0_DOMAIN")}/.well-known/openid-configuration',
)

# --- Auth routes ---
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/login")
def login():
    return auth0.authorize_redirect(redirect_uri=url_for("callback", _external=True))

@app.route("/callback")
def callback():
    token = auth0.authorize_access_token()
    session["user"] = token
    return redirect(url_for("boarding"))

@app.route("/logout")
def logout():
    session.clear()
    return redirect(f'https://{os.getenv("AUTH0_DOMAIN")}/v2/logout?returnTo={url_for("index", _external=True)}&client_id={os.getenv("AUTH0_CLIENT_ID")}')

# --- Boarding pass route (runs after login) ---
@app.route("/boarding", methods=["GET", "POST"])
def boarding():
    if "user" not in session:
        return redirect(url_for("login"))
    if request.method == "POST":
        session["flight"] = request.form["flight"]
        session["seat"] = request.form["seat"]
        session["passenger"] = request.form["name"]
        return redirect(url_for("game"))
    return render_template("boarding.html")

# --- Game page ---
@app.route("/game")
def game():
    if "seat" not in session:
        return redirect(url_for("boarding"))
    return render_template("game.html",
        seat=session["seat"],
        flight=session["flight"],
        passenger=session["passenger"])

# --- Order API (called by Phaser JS) ---
orders = []  # in-memory for MVP, no DB needed

@app.route("/api/order", methods=["POST"])
def place_order():
    data = request.json
    order = {
        "id": len(orders) + 1,
        "passenger": session.get("passenger"),
        "seat": session.get("seat"),
        "flight": session.get("flight"),
        "items": data["items"],
        "total": data["total"],
        "status": "confirmed"
    }
    orders.append(order)
    return jsonify({"success": True, "order": order})

@app.route("/orders")
def view_orders():
    return render_template("orders.html", orders=orders)

if __name__ == "__main__":
    app.run(debug=True)




<!DOCTYPE html>
<html>
<head>
  <title>GateRoam</title>
  /static/style.css">
</head>
<body>
  <div class="hero">
    <h1>✈ GateRoam</h1>
    <p>Shop your terminal. Get it at your seat.</p>
    <a href="/login" class="btn">Login with Boarding Pass</a>
  </div>
</body>
</html>
