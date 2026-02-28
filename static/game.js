// ==========================================
// CONSTANTS & STATE
// ==========================================
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 3;
let cart = [];
let activeStore = null;      // Currently open shop modal store name
let currentZoneName = null;  // Zone the player is standing in (for prompt)
let navTarget = null;        // Navigation target {x, y, name}
let navLine = null;          // Phaser graphics object for nav line
let navArrow = null;         // Phaser image for nav arrow
let promptText = null;       // Phaser text for "Press Enter" prompt

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
// MAP LAYOUT — stores + landmarks
// ==========================================
const mapZones = [
    // Stores
    { name: "WHSmith", x: 80, y: 180, w: 140, h: 100, color: 0x004c97, type: "store" },
    { name: "Pret A Manger", x: 280, y: 180, w: 160, h: 100, color: 0x82001e, type: "store" },
    { name: "Duty Free", x: 500, y: 180, w: 160, h: 100, color: 0x906800, type: "store" },
    { name: "Boots", x: 80, y: 420, w: 140, h: 100, color: 0x003e7e, type: "store" },
    { name: "Coffee Shop", x: 280, y: 420, w: 160, h: 100, color: 0x6f4e37, type: "store" },
    // Landmarks
    { name: "Toilets", x: 700, y: 180, w: 80, h: 100, color: 0x2c6e49, type: "landmark" },
    { name: "Lounge", x: 500, y: 420, w: 160, h: 100, color: 0x4a3080, type: "landmark" },
    { name: "Gate A1", x: 150, y: 40, w: 200, h: 60, color: 0x5660a1, type: "landmark" },
    { name: "Gate B2", x: 500, y: 40, w: 200, h: 60, color: 0x5660a1, type: "landmark" },
];

// ==========================================
// UI ELEMENT REFERENCES
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

// ==========================================
// SHOP MODAL LOGIC
// ==========================================
closeShopBtn.addEventListener("click", () => {
    shopModal.classList.remove("active");
    activeStore = null;
});

function openShop(storeName) {
    if (activeStore === storeName) return;
    activeStore = storeName;

    shopTitle.textContent = storeName;
    productList.innerHTML = "";

    const items = stores[storeName];
    items.forEach(item => {
        const li = document.createElement("li");
        li.className = "product-item";

        const info = document.createElement("div");
        info.className = "product-info";
        info.innerHTML = `<span class="product-name">${item.name}</span>
                          <span class="product-price">£${item.price.toFixed(2)}</span>`;

        const addBtn = document.createElement("button");
        addBtn.className = "add-to-cart";
        addBtn.textContent = "Add";
        addBtn.onclick = () => addToCart(item.name, item.price);

        li.appendChild(info);
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

function updateCartUI() {
    cartCountElem.textContent = cart.length;
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    modalCartTotal.textContent = total.toFixed(2);
}

// ==========================================
// CHECKOUT
// ==========================================
checkoutBtn.addEventListener("click", () => {
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
});

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
    navModal.classList.toggle("active");
    if (navModal.classList.contains("active")) {
        buildNavList();
    }
});

closeNavBtn.addEventListener("click", () => {
    navModal.classList.remove("active");
});

function buildNavList() {
    navList.innerHTML = "";
    mapZones.forEach(zone => {
        const li = document.createElement("li");
        li.className = "nav-item";

        const icon = zone.type === "store" ? "🛍️" : (zone.name.startsWith("Gate") ? "🛫" : (zone.name === "Toilets" ? "🚻" : "🛋️"));
        li.innerHTML = `<span>${icon} ${zone.name}</span><span class="nav-type">${zone.type}</span>`;
        li.onclick = () => {
            // Set nav target to center of zone
            navTarget = { x: zone.x + zone.w / 2, y: zone.y + zone.h / 2, name: zone.name };
            navModal.classList.remove("active");
            showNotification(`Navigating to ${zone.name}`);
        };
        navList.appendChild(li);
    });
}

// ==========================================
// ENTER KEY HANDLER (open shop when in store zone)
// ==========================================
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        // If shop modal is open, close it
        if (shopModal.classList.contains("active")) {
            shopModal.classList.remove("active");
            activeStore = null;
            return;
        }
        // If standing in a store zone and modal not open, open it
        if (currentZoneName && stores[currentZoneName] && !shopModal.classList.contains("active")) {
            openShop(currentZoneName);
        }
    }
    // Escape to close modals
    if (e.key === "Escape") {
        shopModal.classList.remove("active");
        activeStore = null;
        navModal.classList.remove("active");
    }
});

// ==========================================
// PHASER GAME SCENE
// ==========================================
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: "MainScene" });
    }

    create() {
        const floorColor = 0x1c234a;

        // Background
        this.cameras.main.setBackgroundColor(floorColor);

        // Draw walkway lines for aesthetics
        const walkway = this.add.graphics();
        walkway.lineStyle(1, 0x2a3260, 0.4);
        for (let i = 0; i < GAME_WIDTH; i += 40) {
            walkway.lineBetween(i, 0, i, GAME_HEIGHT);
        }
        for (let j = 0; j < GAME_HEIGHT; j += 40) {
            walkway.lineBetween(0, j, GAME_WIDTH, j);
        }

        // Draw all zones
        this.zoneGroup = this.physics.add.staticGroup();

        mapZones.forEach(z => {
            // Visual rectangle
            this.add.rectangle(z.x + z.w / 2, z.y + z.h / 2, z.w, z.h, z.color)
                .setStrokeStyle(3, 0xffffff, 0.15);

            // Icon
            const icon = z.type === "store" ? "🛍️" : (z.name.startsWith("Gate") ? "🛫" : (z.name === "Toilets" ? "🚻" : "🛋️"));
            this.add.text(z.x + z.w / 2, z.y + z.h / 2 - 18, icon, { fontSize: "22px" }).setOrigin(0.5);

            // Label
            this.add.text(z.x + z.w / 2, z.y + z.h / 2 + 8, z.name, {
                fontSize: "13px", fill: "#fff", fontStyle: "bold",
                fontFamily: "Inter, sans-serif"
            }).setOrigin(0.5);

            // Sub-label for stores
            if (z.type === "store") {
                this.add.text(z.x + z.w / 2, z.y + z.h / 2 + 26, "Press ENTER", {
                    fontSize: "10px", fill: "#aaa", fontFamily: "Inter, sans-serif"
                }).setOrigin(0.5);
            }

            // Physics zone for overlap detection
            const zone = this.zoneGroup.create(z.x + z.w / 2, z.y + z.h / 2, null);
            zone.setSize(z.w, z.h);
            zone.setVisible(false);
            zone.body.setSize(z.w, z.h);
            zone.zoneName = z.name;
            zone.zoneType = z.type;
        });

        // Player texture
        const gfx = this.add.graphics();
        gfx.fillStyle(0xf39c12);
        gfx.fillCircle(12, 12, 12);
        gfx.lineStyle(2, 0xffffff);
        gfx.strokeCircle(12, 12, 12);
        gfx.generateTexture("player_tex", 24, 24);
        gfx.destroy();

        this.player = this.physics.add.sprite(400, 320, "player_tex");
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(10);

        // Prompt text (follows player)
        promptText = this.add.text(400, 300, "", {
            fontSize: "13px",
            fill: "#f39c12",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: { x: 8, y: 4 },
            fontFamily: "Inter, sans-serif",
            fontStyle: "bold"
        }).setOrigin(0.5).setDepth(11).setVisible(false);

        // Navigation line graphics
        navLine = this.add.graphics().setDepth(5);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // Track overlap state
        this.isOverlapping = false;
    }

    update() {
        // ---- Navigation line ----
        navLine.clear();
        if (navTarget) {
            const px = this.player.x;
            const py = this.player.y;
            const tx = navTarget.x;
            const ty = navTarget.y;
            const dist = Phaser.Math.Distance.Between(px, py, tx, ty);

            // Draw dashed line
            navLine.lineStyle(2, 0xf39c12, 0.7);
            const dashLen = 10;
            const gapLen = 6;
            const angle = Math.atan2(ty - py, tx - px);
            let drawn = 0;
            let cx = px, cy = py;
            while (drawn < dist) {
                const endDash = Math.min(drawn + dashLen, dist);
                const ex = px + Math.cos(angle) * endDash;
                const ey = py + Math.sin(angle) * endDash;
                navLine.beginPath();
                navLine.moveTo(cx, cy);
                navLine.lineTo(ex, ey);
                navLine.strokePath();
                drawn = endDash + gapLen;
                cx = px + Math.cos(angle) * drawn;
                cy = py + Math.sin(angle) * drawn;
            }

            // Draw target circle
            navLine.lineStyle(2, 0xf39c12, 0.9);
            navLine.strokeCircle(tx, ty, 18);

            // If close enough, clear nav
            if (dist < 30) {
                showNotification(`Arrived at ${navTarget.name}!`);
                navTarget = null;
            }
        }

        // ---- Don't move if modal is open ----
        if (shopModal.classList.contains("active") || navModal.classList.contains("active")) {
            this.player.setVelocity(0);
            return;
        }

        // ---- Movement ----
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

        // ---- Zone overlap detection ----
        let foundZone = null;
        this.zoneGroup.getChildren().forEach(zone => {
            if (this.physics.overlap(this.player, zone)) {
                foundZone = zone;
            }
        });

        if (foundZone) {
            currentZoneName = foundZone.zoneName;
            // Show prompt above player
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
            // If player walked away from a store while modal is NOT open, clear activeStore
            if (!shopModal.classList.contains("active")) {
                activeStore = null;
            }
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
