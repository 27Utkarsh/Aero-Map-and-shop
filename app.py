import json
import os
from urllib.parse import quote_plus, urlencode
from functools import wraps
from flask import Flask, redirect, render_template, session, url_for, request, jsonify
from authlib.integrations.flask_client import OAuth
from dotenv import find_dotenv, load_dotenv

# Load .env file
ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "super-secret-key-change-in-production")

# Auth0 Configuration
AUTH0_DOMAIN = os.environ.get("AUTH0_DOMAIN")
AUTH0_CLIENT_ID = os.environ.get("AUTH0_CLIENT_ID")
AUTH0_CLIENT_SECRET = os.environ.get("AUTH0_CLIENT_SECRET")

oauth = OAuth(app)
oauth.register(
    "auth0",
    client_id=AUTH0_CLIENT_ID,
    client_secret=AUTH0_CLIENT_SECRET,
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f"https://{AUTH0_DOMAIN}/.well-known/openid-configuration",
)

# Load ticket data from JSON
TICKETS_PATH = os.path.join(os.path.dirname(__file__), "Assets", "Tickets.json")
with open(TICKETS_PATH, "r", encoding="utf-8") as f:
    TICKETS = json.load(f)

# Build a lookup dict by PNR (case-insensitive)
TICKET_BY_PNR = {t["pnr"].upper(): t for t in TICKETS}

# In-memory "database" for MVP
mock_orders = []

# ---------- Auth Decorators ----------

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user" not in session:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated

def requires_boarding_pass(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user" not in session:
            return redirect("/login")
        if "ticket" not in session:
            return redirect("/boarding")
        return f(*args, **kwargs)
    return decorated

# ---------- Routes ----------

@app.route("/")
def home():
    if "user" in session:
        if "ticket" in session:
            return redirect("/game")
        return redirect("/boarding")
    return render_template("index.html")

@app.route("/login")
def login():
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )

@app.route("/callback", methods=["GET", "POST"])
def callback():
    token = oauth.auth0.authorize_access_token()
    session["user"] = token
    return redirect("/boarding")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(
        "https://" + AUTH0_DOMAIN
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("home", _external=True),
                "client_id": AUTH0_CLIENT_ID,
            },
            quote_via=quote_plus,
        )
    )

@app.route("/boarding", methods=["GET", "POST"])
@requires_auth
def boarding():
    error = None
    if request.method == "POST":
        pnr = request.form.get("pnr", "").strip().upper()
        ticket = TICKET_BY_PNR.get(pnr)
        if ticket:
            session["ticket"] = ticket
            return redirect("/game")
        else:
            error = f"No booking found for PNR: {pnr}. Please check and try again."
    return render_template("boarding.html", user=session["user"], error=error)

@app.route("/game")
@requires_boarding_pass
def game():
    ticket = session["ticket"]
    return render_template(
        "game.html",
        user=session["user"],
        ticket=ticket
    )

@app.route("/api/order", methods=["POST"])
@requires_boarding_pass
def create_order():
    data = request.json
    cart = data.get("cart", [])
    total = sum(item.get("price", 0) for item in cart)
    ticket = session["ticket"]

    order = {
        "user_email": session["user"].get("userinfo", {}).get("email", "unknown"),
        "passenger_name": ticket.get("passenger_name"),
        "flight": ticket.get("flight_number"),
        "seat": ticket.get("seat"),
        "gate": ticket.get("gate"),
        "cart_items": cart,
        "total": total
    }
    mock_orders.append(order)
    return jsonify({"success": True, "order": order})

@app.route("/orders")
@requires_boarding_pass
def orders():
    user_email = session["user"].get("userinfo", {}).get("email", "unknown")
    user_orders = [o for o in mock_orders if o["user_email"] == user_email]
    latest_order = user_orders[-1] if user_orders else None

    return render_template(
        "orders.html",
        user=session["user"],
        order=latest_order
    )

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
