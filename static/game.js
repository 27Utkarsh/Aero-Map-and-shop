// ==========================================
// CONSTANTS & STATE
// ==========================================
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 3;
let cart = [];
let activeStore = null;
let currentZoneName = null;
let navTarget = null;
let navLine = null;
let promptText = null;
let checkoutLocked = false;

// ==========================================
// HARDCODED STORE DATA
// ==========================================
const stores = {
    "WHSmith": [
        { name: "Sandwich", price: 4.50 },
        { name: "Water Bottle", price: 1.99 },
        { name: "Magazine", price: 3.99 }
    ],
    "Pret A Manger": [
        { name: "Croissant", price: 2.50 },
        { name: "Coffee", price: 3.20 },
        { name: "Fruit Salad", price: 3.80 }
    ],
    "Duty Free": [
        { name: "Perfume", price: 35.00 },
        { name: "Chocolates", price: 8.99 },
        { name: "Sunglasses", price: 19.99 }
    ],
    "Boots": [
        { name: "Lip Balm", price: 2.99 },
        { name: "Travel Pillow", price: 12.99 },
        { name: "Earbuds", price: 14.99 }
    ],
    "Coffee Shop": [
        { name: "Latte", price: 3.50 },
        { name: "Muffin", price: 2.00 },
        { name: "Hot Chocolate", price: 3.00 }
    ]
};

// ==========================================
// MAP LAYOUT
// ==========================================
const mapZones = [
    { name: "WHSmith", x: 80, y: 180, w: 140, h: 100, color: 0x004c97, type: "store" },
    { name: "Pret A Manger", x: 280, y: 180, w: 160, h: 100, color: 0x82001e, type: "store" },
    { name: "Duty Free", x: 500, y: 180, w: 160, h: 100, color: 0x906800, type: "store" },
    { name: "Boots", x: 80, y: 420, w: 140, h: 100, color: 0x003e7e, type: "store" },
    { name: "Coffee Shop", x: 280, y: 420, w: 160, h: 100, color: 0x6f4e37, type: "store" },
    { name: "Toilets", x: 700, y: 180, w: 80, h: 100, color: 0x2c6e49, type: "landmark" },
    { name: "Lounge", x: 500, y: 420, w: 160, h: 100, color: 0x4a3080, type: "landmark" },
    { name: "Gate A1", x: 150, y: 40, w: 200, h: 60, color: 0x5660a1, type: "landmark" },
    { name: "Gate B2", x: 500, y: 40, w: 200, h: 60, color: 0x5660a1, type: "landmark" },
];

// ==========================================
// UI REFERENCES
// ==========================================
const shopModal = document.getElementById("shop-modal");
const shopTitle = document.getElementById("shop-title");
const productList = document.getElementById("product-list");
const modalCartTotal = document.getElementById("modal-cart-total");
const cartCountElem = document.getElementById("cart-count");
const closeShopBtn = document.getElementById("close-shop-btn");
const checkoutBtn = document.getElementById("checkout-btn");
const navModal = document.getElementById("nav-modal");
const navList = document.getElementById("nav-list");
const navBtn = document.getElementById("nav-btn");
const closeNavBtn = document.getElementById("close-nav-btn");
const cartModal = document.getElementById("cart-modal");
const cartList = document.getElementById("cart-list");
const cartBtn = document.getElementById("cart-btn");
const closeCartBtn = document.getElementById("close-cart-btn");
const cartEmptyMsg = document.getElementById("cart-empty-msg");
const cartFooter = document.getElementById("cart-footer");
const cartModalTotal = document.getElementById("cart-modal-total");
const clearCartBtn = document.getElementById("clear-cart-btn");
const cartCheckoutBtn = document.getElementById("cart-checkout-btn");
const boardingTimerElem = document.getElementById("boarding-timer");

// ==========================================
// BOARDING COUNTDOWN TIMER
// ==========================================
let secondsLeft = window.boardingSecondsLeft || 1800; // 30 minutes default

function updateTimerDisplay() {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    if (secondsLeft <= 0) {
        boardingTimerElem.textContent = "🚨 BOARDING NOW";
        boardingTimerElem.style.color = "#ff685b";
        boardingTimerElem.style.animation = "pulse 1s infinite";
        checkoutLocked = true;
    } else if (secondsLeft <= 900) {
        // 15 minutes or less — lock checkout
        boardingTimerElem.textContent = `🔒 ${timeStr} to board — CHECKOUT CLOSED`;
        boardingTimerElem.style.color = "#ff685b";
        checkoutLocked = true;
    } else if (secondsLeft <= 1200) {
        // 20 minutes or less — warning
        boardingTimerElem.textContent = `⚠️ ${timeStr} to board`;
        boardingTimerElem.style.color = "#ebca40";
    } else {
        boardingTimerElem.textContent = `⏱️ ${timeStr} to board`;
        boardingTimerElem.style.color = "#3b82f6";
    }
}

updateTimerDisplay();
setInterval(() => {
    if (secondsLeft > 0) {
        secondsLeft--;
        updateTimerDisplay();
    }
}, 1000);

// ==========================================
// CLOSE ALL MODALS HELPER
// ==========================================
function closeAllModals() {
    shopModal.classList.remove("active");
    navModal.classList.remove("active");
    cartModal.classList.remove("active");
    activeStore = null;
}

// ==========================================
// SHOP MODAL
// ==========================================
closeShopBtn.addEventListener("click", () => {
    shopModal.classList.remove("active");
    activeStore = null;
});

function openShop(storeName) {
    if (activeStore === storeName) return;
    closeAllModals();
    activeStore = storeName;

    shopTitle.textContent = storeName;
    productList.innerHTML = "";

    const items = stores[storeName];
    items.forEach(item => {
        const li = document.createElement("li");
        li.className = "product-item";
        li.innerHTML = `
            <div class="product-info">
                <span class="product-name">${item.name}</span>
                <span class="product-price">£${item.price.toFixed(2)}</span>
            </div>`;

        const addBtn = document.createElement("button");
        addBtn.className = "add-to-cart";
        addBtn.textContent = "+ Add";
        addBtn.onclick = () => addToCart(item.name, item.price);

        li.appendChild(addBtn);
        productList.appendChild(li);
    });

    shopModal.classList.add("active");
}

// ==========================================
// CART LOGIC
// ==========================================
function addToCart(itemName, itemPrice) {
    cart.push({ name: itemName, price: itemPrice });
    updateCartUI();
    showNotification(`Added ${itemName} to cart!`);
}

function removeFromCart(index) {
    const removed = cart.splice(index, 1);
    updateCartUI();
    renderCartModal();
    showNotification(`Removed ${removed[0].name} from cart`);
}

function clearCart() {
    cart = [];
    updateCartUI();
    renderCartModal();
    showNotification("Cart cleared");
}

function updateCartUI() {
    cartCountElem.textContent = cart.length;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    modalCartTotal.textContent = total.toFixed(2);
    cartModalTotal.textContent = total.toFixed(2);
}

// ==========================================
// CART MODAL
// ==========================================
cartBtn.addEventListener("click", () => {
    closeAllModals();
    renderCartModal();
    cartModal.classList.add("active");
});

closeCartBtn.addEventListener("click", () => {
    cartModal.classList.remove("active");
});

clearCartBtn.addEventListener("click", clearCart);

cartCheckoutBtn.addEventListener("click", () => {
    cartModal.classList.remove("active");
    doCheckout();
});

function renderCartModal() {
    cartList.innerHTML = "";

    if (cart.length === 0) {
        cartEmptyMsg.style.display = "block";
        cartFooter.style.display = "none";
        return;
    }

    cartEmptyMsg.style.display = "none";
    cartFooter.style.display = "block";

    cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "product-item";
        li.innerHTML = `
            <div class="product-info">
                <span class="product-name">${item.name}</span>
                <span class="product-price">£${item.price.toFixed(2)}</span>
            </div>`;

        const removeBtn = document.createElement("button");
        removeBtn.className = "add-to-cart remove-btn";
        removeBtn.textContent = "✕";
        removeBtn.onclick = () => removeFromCart(index);

        li.appendChild(removeBtn);
        cartList.appendChild(li);
    });
}

// ==========================================
// CHECKOUT
// ==========================================
checkoutBtn.addEventListener("click", doCheckout);

function doCheckout() {
    if (checkoutLocked) {
        alert("⛔ Checkout is locked! Boarding begins in less than 15 minutes. Please head to your gate.");
        return;
    }
    if (cart.length === 0) {
        alert("Your cart is empty! Walk to a store to grab some items.");
        return;
    }

    fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: cart })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.location.href = "/orders";
            } else {
                alert("Checkout failed. Try again.");
            }
        })
        .catch(err => console.error("Checkout error:", err));
}

// ==========================================
// NOTIFICATION
// ==========================================
function showNotification(message) {
    const notif = document.createElement("div");
    notif.className = "notification";
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => { if (notif.parentNode) notif.parentNode.removeChild(notif); }, 3000);
}

// ==========================================
// NAVIGATION MODAL
// ==========================================
navBtn.addEventListener("click", () => {
    closeAllModals();
    buildNavList();
    navModal.classList.add("active");
});

closeNavBtn.addEventListener("click", () => {
    navModal.classList.remove("active");
});

function buildNavList() {
    navList.innerHTML = "";
    mapZones.forEach(zone => {
        const li = document.createElement("li");
        li.className = "nav-item";
        const icon = zone.type === "store" ? "🛍️"
            : (zone.name.startsWith("Gate") ? "🛫"
                : (zone.name === "Toilets" ? "🚻" : "🛋️"));
        li.innerHTML = `<span>${icon} ${zone.name}</span><span class="nav-type">${zone.type}</span>`;
        li.onclick = () => {
            navTarget = { x: zone.x + zone.w / 2, y: zone.y + zone.h / 2, name: zone.name };
            navModal.classList.remove("active");
            showNotification(`Navigating to ${zone.name}`);
        };
        navList.appendChild(li);
    });
}

// ==========================================
// ENTER KEY & ESCAPE
// ==========================================
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        if (shopModal.classList.contains("active") || cartModal.classList.contains("active") || navModal.classList.contains("active")) {
            closeAllModals();
            return;
        }
        if (currentZoneName && stores[currentZoneName]) {
            openShop(currentZoneName);
        }
    }
    if (e.key === "Escape") {
        closeAllModals();
    }
});

// ==========================================
// PHASER GAME
// ==========================================
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
    }

    create() {
        this.cameras.main.setBackgroundColor(0x1c234a);

        // Floor grid
        const walkway = this.add.graphics();
        walkway.lineStyle(1, 0x2a3260, 0.4);
        for (let i = 0; i < GAME_WIDTH; i += 40) walkway.lineBetween(i, 0, i, GAME_HEIGHT);
        for (let j = 0; j < GAME_HEIGHT; j += 40) walkway.lineBetween(0, j, GAME_WIDTH, j);

        // Draw zones
        this.zoneGroup = this.physics.add.staticGroup();

        mapZones.forEach(z => {
            this.add.rectangle(z.x + z.w / 2, z.y + z.h / 2, z.w, z.h, z.color)
                .setStrokeStyle(3, 0xffffff, 0.15);

            const icon = z.type === "store" ? "🛍️"
                : (z.name.startsWith("Gate") ? "🛫"
                    : (z.name === "Toilets" ? "🚻" : "🛋️"));
            this.add.text(z.x + z.w / 2, z.y + z.h / 2 - 18, icon, { fontSize: "22px" }).setOrigin(0.5);
            this.add.text(z.x + z.w / 2, z.y + z.h / 2 + 8, z.name, {
                fontSize: "13px", fill: "#fff", fontStyle: "bold", fontFamily: "Inter, sans-serif"
            }).setOrigin(0.5);

            if (z.type === "store") {
                this.add.text(z.x + z.w / 2, z.y + z.h / 2 + 26, "Press ENTER", {
                    fontSize: "10px", fill: "#aaa", fontFamily: "Inter, sans-serif"
                }).setOrigin(0.5);
            }

            const zone = this.zoneGroup.create(z.x + z.w / 2, z.y + z.h / 2, null);
            zone.setSize(z.w, z.h);
            zone.setVisible(false);
            zone.body.setSize(z.w, z.h);
            zone.zoneName = z.name;
            zone.zoneType = z.type;
        });

        // Player
        const gfx = this.add.graphics();
        gfx.fillStyle(0x3b82f6);
        gfx.fillCircle(12, 12, 12);
        gfx.lineStyle(2, 0xffffff);
        gfx.strokeCircle(12, 12, 12);
        gfx.generateTexture("player_tex", 24, 24);
        gfx.destroy();

        this.player = this.physics.add.sprite(400, 320, "player_tex");
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Prompt text
        promptText = this.add.text(400, 300, "", {
            fontSize: "13px", fill: "#3b82f6",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: { x: 8, y: 4 },
            fontFamily: "Inter, sans-serif", fontStyle: "bold"
        }).setOrigin(0.5).setDepth(11).setVisible(false);

        // Nav line
        navLine = this.add.graphics().setDepth(5);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
    }

    update() {
        // Nav line
        navLine.clear();
        if (navTarget) {
            const px = this.player.x, py = this.player.y;
            const tx = navTarget.x, ty = navTarget.y;
            const dist = Phaser.Math.Distance.Between(px, py, tx, ty);
            const angle = Math.atan2(ty - py, tx - px);

            navLine.lineStyle(2, 0x3b82f6, 0.7);
            let drawn = 0;
            let cx = px, cy = py;
            while (drawn < dist) {
                const endDash = Math.min(drawn + 10, dist);
                navLine.beginPath();
                navLine.moveTo(cx, cy);
                navLine.lineTo(px + Math.cos(angle) * endDash, py + Math.sin(angle) * endDash);
                navLine.strokePath();
                drawn = endDash + 6;
                cx = px + Math.cos(angle) * drawn;
                cy = py + Math.sin(angle) * drawn;
            }
            navLine.lineStyle(2, 0x3b82f6, 0.9);
            navLine.strokeCircle(tx, ty, 18);

            if (dist < 30) {
                showNotification(`Arrived at ${navTarget.name}!`);
                navTarget = null;
            }
        }

        // Freeze movement when any modal is open
        const anyModalOpen = shopModal.classList.contains("active")
            || navModal.classList.contains("active")
            || cartModal.classList.contains("active");

        if (anyModalOpen) {
            this.player.setVelocity(0);
            return;
        }

        // Movement
        let velX = 0, velY = 0;
        if (this.cursors.left.isDown || this.wasd.left.isDown) velX = -1;
        else if (this.cursors.right.isDown || this.wasd.right.isDown) velX = 1;
        if (this.cursors.up.isDown || this.wasd.up.isDown) velY = -1;
        else if (this.cursors.down.isDown || this.wasd.down.isDown) velY = 1;

        if (velX !== 0 || velY !== 0) {
            const angle = Math.atan2(velY, velX);
            this.player.setVelocityX(Math.cos(angle) * PLAYER_SPEED * 60);
            this.player.setVelocityY(Math.sin(angle) * PLAYER_SPEED * 60);
        } else {
            this.player.setVelocity(0);
        }

        // Zone overlap
        let foundZone = null;
        this.zoneGroup.getChildren().forEach(zone => {
            if (this.physics.overlap(this.player, zone)) foundZone = zone;
        });

        if (foundZone) {
            currentZoneName = foundZone.zoneName;
            if (foundZone.zoneType === "store") {
                promptText.setText(`🛍️ ${foundZone.zoneName} — Press ENTER to shop`);
            } else {
                promptText.setText(`📍 ${foundZone.zoneName}`);
            }
            promptText.setPosition(this.player.x, this.player.y - 28);
            promptText.setVisible(true);
        } else {
            currentZoneName = null;
            promptText.setVisible(false);
            if (!shopModal.classList.contains("active")) activeStore = null;
        }
    }
}

// ==========================================
// PHASER CONFIG
// ==========================================
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: "game-container",
    transparent: true,
    physics: {
        default: "arcade",
        arcade: { debug: false, gravity: { y: 0 } }
    },
    scene: MainScene
};

const game = new Phaser.Game(config);
