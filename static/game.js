// ==========================================
// CONSTANTS & STATE
// ==========================================
const PLAYER_SPEED = 0.12;
let cart = [];
let activeStore = null;
let currentZoneName = null;
let navTarget = null;
let checkoutLocked = false;

// ==========================================
// HARDCODED STORE DATA
// ==========================================
const stores = {
    "WHSmith": [{ name: "Sandwich", price: 4.50 }, { name: "Water Bottle", price: 1.99 }, { name: "Magazine", price: 3.99 }],
    "Pret A Manger": [{ name: "Croissant", price: 2.50 }, { name: "Coffee", price: 3.20 }, { name: "Fruit Salad", price: 3.80 }],
    "Duty Free": [{ name: "Perfume", price: 35.00 }, { name: "Chocolates", price: 8.99 }, { name: "Sunglasses", price: 19.99 }],
    "Boots": [{ name: "Lip Balm", price: 2.99 }, { name: "Travel Pillow", price: 12.99 }, { name: "Earbuds", price: 14.99 }],
    "Coffee Shop": [{ name: "Latte", price: 3.50 }, { name: "Muffin", price: 2.00 }, { name: "Hot Chocolate", price: 3.00 }]
};

// ==========================================
// 3D MAP LAYOUT — positions in world space
// ==========================================
const mapZones = [
    // Stores — left wall (further from gates)
    { name: "WHSmith", x: -20, z: -13, w: 8, d: 6, h: 4.5, color: 0x1d4ed8, type: "store" },
    { name: "Pret A Manger", x: -8, z: -13, w: 8, d: 6, h: 4.5, color: 0xb91c1c, type: "store" },
    { name: "Duty Free", x: 5, z: -13, w: 8, d: 6, h: 4.5, color: 0xb45309, type: "store" },
    // Stores — right wall
    { name: "Boots", x: -20, z: 13, w: 8, d: 6, h: 4.5, color: 0x1e40af, type: "store" },
    { name: "Coffee Shop", x: -8, z: 13, w: 8, d: 6, h: 4.5, color: 0x78350f, type: "store" },
    // Landmarks
    { name: "Toilets", x: 19, z: -13, w: 6, d: 6, h: 4, color: 0x166534, type: "landmark" },
    { name: "Lounge", x: 5, z: 13, w: 8, d: 6, h: 4, color: 0x581c87, type: "landmark" },
    // Gates — far end of terminal
    { name: "Gate A1", x: -13, z: -28, w: 10, d: 5, h: 5, color: 0x3730a3, type: "landmark" },
    { name: "Gate B2", x: 8, z: -28, w: 10, d: 5, h: 5, color: 0x3730a3, type: "landmark" },
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
const zonePrompt = document.getElementById("zone-prompt");
const paymentModal = document.getElementById("payment-modal");
const closePaymentBtn = document.getElementById("close-payment-btn");
const paymentTotalElem = document.getElementById("payment-total");
const joystickZone = document.getElementById("joystick-zone");
const joystickThumb = document.getElementById("joystick-thumb");

// ==========================================
// MOBILE JOYSTICK STATE
// ==========================================
const JOYSTICK_MAX_RADIUS = 35; // max px the thumb travels from centre
let joystickActive = false;
let joystickDirX = 0; // -1 (left)  →  +1 (right)
let joystickDirY = 0; // -1 (up)    →  +1 (down)
let joystickOriginX = 0, joystickOriginY = 0;

// ==========================================
// BOARDING COUNTDOWN TIMER
// ==========================================
let secondsLeft = window.boardingSecondsLeft || 1800;

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
        boardingTimerElem.textContent = `🔒 ${timeStr} to board — CHECKOUT CLOSED`;
        boardingTimerElem.style.color = "#ff685b";
        checkoutLocked = true;
    } else if (secondsLeft <= 1200) {
        boardingTimerElem.textContent = `⚠️ ${timeStr} to board`;
        boardingTimerElem.style.color = "#ebca40";
    } else {
        boardingTimerElem.textContent = `⏱️ ${timeStr} to board`;
        boardingTimerElem.style.color = "#3b82f6";
    }
}

updateTimerDisplay();
setInterval(() => {
    if (secondsLeft > 0) { secondsLeft--; updateTimerDisplay(); }
}, 1000);

// ==========================================
// CLOSE ALL MODALS
// ==========================================
function closeAllModals() {
    shopModal.classList.remove("active");
    navModal.classList.remove("active");
    cartModal.classList.remove("active");
    paymentModal.classList.remove("active");
    activeStore = null;
}

function anyModalOpen() {
    return shopModal.classList.contains("active") ||
        navModal.classList.contains("active") ||
        cartModal.classList.contains("active") ||
        paymentModal.classList.contains("active");
}

// ==========================================
// SHOP MODAL
// ==========================================
closeShopBtn.addEventListener("click", () => { shopModal.classList.remove("active"); activeStore = null; });

// Checkout directly from the shop modal
document.getElementById("shop-checkout-btn").addEventListener("click", () => {
    shopModal.classList.remove("active");
    activeStore = null;
    doCheckout();
});

// How many of this item are in the global cart?
function getItemQty(name) {
    return cart.filter(i => i.name === name).length;
}

// Remove one instance of an item by name (most recently added)
function removeOneFromCart(name) {
    for (let i = cart.length - 1; i >= 0; i--) {
        if (cart[i].name === name) {
            cart.splice(i, 1);
            updateCartUI();
            showNotification(`Removed ${name}`);
            return;
        }
    }
}

// Build/rebuild the product list inside the shop modal.
// Shows −qty+ controls when qty > 0, plain '+ Add' otherwise.
function renderShopItems(storeName) {
    if (!storeName || !stores[storeName]) return;
    productList.innerHTML = "";

    stores[storeName].forEach(item => {
        const qty = getItemQty(item.name);
        const li = document.createElement("li");
        li.className = "product-item";

        const info = document.createElement("div");
        info.className = "product-info";
        info.innerHTML = `<span class="product-name">${item.name}</span><span class="product-price">£${item.price.toFixed(2)}</span>`;
        li.appendChild(info);

        const controls = document.createElement("div");
        controls.className = "qty-controls";

        if (qty > 0) {
            const minusBtn = document.createElement("button");
            minusBtn.className = "qty-btn";
            minusBtn.textContent = "\u2212"; // − minus sign
            minusBtn.onclick = () => removeOneFromCart(item.name);

            const qtyDisplay = document.createElement("span");
            qtyDisplay.className = "qty-display";
            qtyDisplay.textContent = qty;

            const plusBtn = document.createElement("button");
            plusBtn.className = "qty-btn";
            plusBtn.textContent = "+";
            plusBtn.onclick = () => addToCart(item.name, item.price);

            controls.appendChild(minusBtn);
            controls.appendChild(qtyDisplay);
            controls.appendChild(plusBtn);
        } else {
            const addBtn = document.createElement("button");
            addBtn.className = "add-to-cart";
            addBtn.textContent = "+ Add";
            addBtn.onclick = () => addToCart(item.name, item.price);
            controls.appendChild(addBtn);
        }

        li.appendChild(controls);
        productList.appendChild(li);
    });

    // Show/hide the in-store checkout button based on cart state
    const shopCheckoutBtn = document.getElementById("shop-checkout-btn");
    if (shopCheckoutBtn) shopCheckoutBtn.style.display = cart.length > 0 ? "inline-flex" : "none";
}

function openShop(storeName) {
    if (activeStore === storeName) return;
    closeAllModals();
    activeStore = storeName;
    shopTitle.textContent = storeName;
    renderShopItems(storeName);
    shopModal.classList.add("active");
}

// ==========================================
// CART LOGIC
// ==========================================
function addToCart(n, p) { cart.push({ name: n, price: p }); updateCartUI(); showNotification(`Added ${n} to cart!`); }
function removeFromCart(i) { const r = cart.splice(i, 1); updateCartUI(); renderCartModal(); showNotification(`Removed ${r[0].name}`); }
function clearCart() { cart = []; updateCartUI(); renderCartModal(); showNotification("Cart cleared"); }
function updateCartUI() {
    cartCountElem.textContent = cart.length;
    const t = cart.reduce((s, i) => s + i.price, 0);
    modalCartTotal.textContent = t.toFixed(2);
    cartModalTotal.textContent = t.toFixed(2);
    // Keep shop item quantities in sync while the shop modal is open
    if (activeStore) renderShopItems(activeStore);
}

// ==========================================
// CART MODAL
// ==========================================
cartBtn.addEventListener("click", () => { closeAllModals(); renderCartModal(); cartModal.classList.add("active"); });
closeCartBtn.addEventListener("click", () => { cartModal.classList.remove("active"); });
clearCartBtn.addEventListener("click", clearCart);
cartCheckoutBtn.addEventListener("click", () => { cartModal.classList.remove("active"); doCheckout(); });

function renderCartModal() {
    cartList.innerHTML = "";
    if (cart.length === 0) { cartEmptyMsg.style.display = "block"; cartFooter.style.display = "none"; return; }
    cartEmptyMsg.style.display = "none";
    cartFooter.style.display = "block";
    cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "product-item";
        li.innerHTML = `<div class="product-info"><span class="product-name">${item.name}</span><span class="product-price">£${item.price.toFixed(2)}</span></div>`;
        const rb = document.createElement("button"); rb.className = "add-to-cart remove-btn"; rb.textContent = "✕"; rb.onclick = () => removeFromCart(index);
        li.appendChild(rb); cartList.appendChild(li);
    });
}

// ==========================================
// CHECKOUT — opens payment modal first
// ==========================================
checkoutBtn.addEventListener("click", doCheckout);
function doCheckout() {
    if (checkoutLocked) { alert("⛔ Checkout is locked! Boarding begins in less than 15 minutes."); return; }
    if (cart.length === 0) { alert("Your cart is empty!"); return; }
    // Show payment modal
    closeAllModals();
    const total = cart.reduce((s, i) => s + i.price, 0);
    paymentTotalElem.textContent = total.toFixed(2);
    paymentModal.classList.add("active");
}

// ==========================================
// PAYMENT MODAL
// ==========================================
closePaymentBtn.addEventListener("click", () => { paymentModal.classList.remove("active"); });

// Tapping the dark backdrop (the dimmed area above the modal) closes everything
document.getElementById("modal-backdrop").addEventListener("click", closeAllModals);

document.querySelectorAll(".payment-option").forEach(btn => {
    btn.addEventListener("click", () => {
        const method = btn.dataset.method;
        paymentModal.classList.remove("active");
        showNotification(`Processing ${method.replace("-", " ")}...`);
        // Simulate brief processing delay
        setTimeout(() => submitOrder(method), 800);
    });
});

function submitOrder(paymentMethod) {
    fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cart, payment_method: paymentMethod }) })
        .then(r => r.json()).then(d => { if (d.success) window.location.href = "/orders"; else alert("Checkout failed."); })
        .catch(e => console.error("Checkout error:", e));
}

// ==========================================
// NOTIFICATION
// ==========================================
function showNotification(message) {
    const n = document.createElement("div"); n.className = "notification"; n.textContent = message;
    document.body.appendChild(n);
    setTimeout(() => { if (n.parentNode) n.parentNode.removeChild(n); }, 3000);
}

// ==========================================
// NAVIGATION MODAL
// ==========================================
navBtn.addEventListener("click", () => { closeAllModals(); buildNavList(); navModal.classList.add("active"); });
closeNavBtn.addEventListener("click", () => { navModal.classList.remove("active"); });

function buildNavList() {
    navList.innerHTML = "";
    mapZones.forEach(zone => {
        const li = document.createElement("li"); li.className = "nav-item";
        const icon = zone.type === "store" ? "🛍️" : (zone.name.startsWith("Gate") ? "🛫" : (zone.name === "Toilets" ? "🚻" : "🛋️"));
        li.innerHTML = `<span>${icon} ${zone.name}</span><span class="nav-type">${zone.type}</span>`;
        li.onclick = () => {
            navTarget = { x: zone.x, z: zone.z + (zone.d / 2 + 1.5) * (zone.z < 0 ? 1 : -1), name: zone.name };
            navModal.classList.remove("active");
            showNotification(`Navigating to ${zone.name}`);
        };
        navList.appendChild(li);
    });
}

// ==========================================
// ENTER / ESCAPE KEYS
// ==========================================
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        if (anyModalOpen()) { closeAllModals(); return; }
        if (currentZoneName && stores[currentZoneName]) openShop(currentZoneName);
    }
    if (e.key === "Escape") closeAllModals();
});

// Tap zone prompt to open shop (mobile)
zonePrompt.addEventListener("click", () => {
    if (currentZoneName && stores[currentZoneName]) openShop(currentZoneName);
});

// ==========================================
// THREE.JS — SCENE SETUP
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1628);
scene.fog = new THREE.Fog(0x0b1628, 30, 90);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
const container = document.getElementById("game-container");
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

function resizeRenderer() {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
}
resizeRenderer();
window.addEventListener("resize", resizeRenderer);

// ==========================================
// LIGHTING
// ==========================================
scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
dirLight.position.set(15, 30, 20);
dirLight.castShadow = true;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 80;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

// Blue-tinted point lights for atmosphere
const p1 = new THREE.PointLight(0x3b82f6, 0.4, 50); p1.position.set(-16, 8, 0); scene.add(p1);
const p2 = new THREE.PointLight(0x3b82f6, 0.4, 50); p2.position.set(16, 8, 0); scene.add(p2);

// ==========================================
// GROUND — airport terminal floor
// ==========================================
const floorGeo = new THREE.PlaneGeometry(110, 80);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f1d32, roughness: 0.6, metalness: 0.3 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Walkway stripe down the middle
const walkwayGeo = new THREE.PlaneGeometry(90, 10);
const walkwayMat = new THREE.MeshStandardMaterial({ color: 0x162544, roughness: 0.5 });
const walkway = new THREE.Mesh(walkwayGeo, walkwayMat);
walkway.rotation.x = -Math.PI / 2;
walkway.position.y = 0.01;
scene.add(walkway);

// Floor grid
const gridHelper = new THREE.GridHelper(110, 55, 0x1e3a5f, 0x1e3a5f);
gridHelper.position.y = 0.02;
scene.add(gridHelper);

// ==========================================
// BUILD 3D STORE & LANDMARK BUILDINGS
// ==========================================
function createTextCanvas(text, width, height, bgColor, fontSize) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // Word wrap
    const words = text.split(" ");
    let lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const w = ctx.measureText(currentLine + " " + words[i]).width;
        if (w < width - 20) { currentLine += " " + words[i]; }
        else { lines.push(currentLine); currentLine = words[i]; }
    }
    lines.push(currentLine);
    const lineHeight = fontSize + 4;
    const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => ctx.fillText(line, width / 2, startY + i * lineHeight));
    return canvas;
}

function hexToCSS(hex) {
    const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
    return `rgb(${r},${g},${b})`;
}

const zoneMeshes = []; // For zone detection

mapZones.forEach(z => {
    const group = new THREE.Group();

    // Main building
    const geo = new THREE.BoxGeometry(z.w, z.h, z.d);
    const mat = new THREE.MeshStandardMaterial({ color: z.color, roughness: 0.4, metalness: 0.2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, z.h / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Glowing edge at top
    const edgeGeo = new THREE.BoxGeometry(z.w + 0.1, 0.15, z.d + 0.1);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 0.5 });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, z.h + 0.07, 0);
    group.add(edge);

    // Sign — front face
    const signCanvas = createTextCanvas(z.name, 256, 128, hexToCSS(z.color), 28);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signGeo = new THREE.PlaneGeometry(z.w * 0.8, z.h * 0.35);
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });
    const sign = new THREE.Mesh(signGeo, signMat);

    // Position sign on the front face (facing walkway)
    if (z.z < 0) {
        sign.position.set(0, z.h * 0.7, z.d / 2 + 0.02);
    } else {
        sign.position.set(0, z.h * 0.7, -z.d / 2 - 0.02);
        sign.rotation.y = Math.PI;
    }
    group.add(sign);

    // Sub-label for stores
    if (z.type === "store") {
        const subCanvas = createTextCanvas("ENTER ↵", 128, 48, "rgba(0,0,0,0)", 18);
        const subTex = new THREE.CanvasTexture(subCanvas);
        const subGeo = new THREE.PlaneGeometry(2, 0.6);
        const subMat = new THREE.MeshBasicMaterial({ map: subTex, transparent: true });
        const sub = new THREE.Mesh(subGeo, subMat);
        if (z.z < 0) { sub.position.set(0, z.h * 0.35, z.d / 2 + 0.02); }
        else { sub.position.set(0, z.h * 0.35, -z.d / 2 - 0.02); sub.rotation.y = Math.PI; }
        group.add(sub);
    }

    // Icon on the side
    const iconMap = { "store": "🛍️", "landmark": "📍" };
    const iconOverrides = { "Toilets": "🚻", "Lounge": "🛋️", "Gate A1": "🛫", "Gate B2": "🛫" };
    const icon = iconOverrides[z.name] || iconMap[z.type];
    const iconCanvas = createTextCanvas(icon, 64, 64, "rgba(0,0,0,0)", 36);
    const iconTex = new THREE.CanvasTexture(iconCanvas);
    const iconGeo = new THREE.PlaneGeometry(1.2, 1.2);
    const iconMat = new THREE.MeshBasicMaterial({ map: iconTex, transparent: true });
    const iconMesh = new THREE.Mesh(iconGeo, iconMat);
    iconMesh.position.set(z.w / 2 + 0.02, z.h * 0.7, 0);
    iconMesh.rotation.y = -Math.PI / 2;
    group.add(iconMesh);

    group.position.set(z.x, 0, z.z);
    scene.add(group);

    // Floating name bubble sprite above building
    const bubbleCanvas = document.createElement("canvas");
    bubbleCanvas.width = 256;
    bubbleCanvas.height = 64;
    const bCtx = bubbleCanvas.getContext("2d");
    // Rounded rect background
    bCtx.fillStyle = "rgba(11, 22, 40, 0.85)";
    bCtx.beginPath();
    bCtx.roundRect(8, 4, 240, 52, 14);
    bCtx.fill();
    bCtx.strokeStyle = "rgba(59, 130, 246, 0.6)";
    bCtx.lineWidth = 2;
    bCtx.beginPath();
    bCtx.roundRect(8, 4, 240, 52, 14);
    bCtx.stroke();
    // Text
    const iconMap2 = { "store": "🛍️", "landmark": "📍" };
    const iconOvr2 = { "Toilets": "🚻", "Lounge": "🛋️", "Gate A1": "🛫", "Gate B2": "🛫" };
    const bIcon = iconOvr2[z.name] || iconMap2[z.type];
    bCtx.font = "bold 22px Inter, Arial, sans-serif";
    bCtx.fillStyle = "#ffffff";
    bCtx.textAlign = "center";
    bCtx.textBaseline = "middle";
    bCtx.fillText(`${bIcon} ${z.name}`, 128, 32);
    const bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
    const bubbleSprite = new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, depthTest: false });
    const bubble = new THREE.Sprite(bubbleSprite);
    bubble.scale.set(4, 1, 1);
    bubble.position.set(z.x, z.h + 1.5, z.z);
    scene.add(bubble);

    // Store zone data for collision
    zoneMeshes.push({
        name: z.name,
        type: z.type,
        x: z.x, z: z.z,
        w: z.w + 2, d: z.d + 2,
        centerX: z.x,
        centerZ: z.z
    });
});

// ==========================================
// CHAIRS near gates
// ==========================================
const chairMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.3 });
const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.5, metalness: 0.2 });

function createChairRow(startX, z, count, facing) {
    for (let i = 0; i < count; i++) {
        const cx = startX + i * 1.2;
        // Seat
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 0.7), seatMat);
        seat.position.set(cx, 0.55, z);
        seat.castShadow = true;
        scene.add(seat);
        // Back
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.1), seatMat);
        back.position.set(cx, 0.95, z + (facing === "north" ? -0.3 : 0.3));
        back.castShadow = true;
        scene.add(back);
        // Legs
        for (const lx of [-0.35, 0.35]) {
            for (const lz of [-0.25, 0.25]) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.55, 0.08), chairMat);
                leg.position.set(cx + lx, 0.275, z + lz);
                scene.add(leg);
            }
        }
        // Armrest
        if (i === 0 || i === count - 1) {
            const armSide = i === 0 ? -0.5 : 0.5;
            const armrest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.5), chairMat);
            armrest.position.set(cx + armSide, 0.75, z);
            scene.add(armrest);
        }
    }
}

// Gate A1 chairs — two rows
createChairRow(-18, -23, 7, "north");
createChairRow(-18, -21, 7, "south");
// Gate B2 chairs — two rows
createChairRow(3, -23, 7, "north");
createChairRow(3, -21, 7, "south");

// ==========================================
// 3D CHARACTER (blocky like example)
// ==========================================
const charGroup = new THREE.Group();

const charMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.35, metalness: 0.15 });
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });

// Torso
const torso = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), charMat);
torso.position.y = 1.8;
torso.castShadow = true;
charGroup.add(torso);

// Head
const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), whiteMat);
head.position.y = 2.75;
head.castShadow = true;
charGroup.add(head);

// Left Arm
const leftArmGroup = new THREE.Group();
leftArmGroup.position.set(-0.55, 2.3, 0);
const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1, 0.25), whiteMat);
leftArm.position.y = -0.4;
leftArm.castShadow = true;
leftArmGroup.add(leftArm);
charGroup.add(leftArmGroup);

// Right Arm
const rightArmGroup = new THREE.Group();
rightArmGroup.position.set(0.55, 2.3, 0);
const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1, 0.25), whiteMat);
rightArm.position.y = -0.4;
rightArm.castShadow = true;
rightArmGroup.add(rightArm);
charGroup.add(rightArmGroup);

// Left Leg
const leftLegGroup = new THREE.Group();
leftLegGroup.position.set(-0.2, 1.2, 0);
const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), charMat);
leftLeg.position.y = -0.6;
leftLeg.castShadow = true;
leftLegGroup.add(leftLeg);
charGroup.add(leftLegGroup);

// Right Leg
const rightLegGroup = new THREE.Group();
rightLegGroup.position.set(0.2, 1.2, 0);
const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), charMat);
rightLeg.position.y = -0.6;
rightLeg.castShadow = true;
rightLegGroup.add(rightLeg);
charGroup.add(rightLegGroup);

charGroup.position.set(-3, 0, -21);
scene.add(charGroup);

// ==========================================
// INPUT
// ==========================================
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
let cameraYaw = Math.PI;

document.addEventListener("keydown", (e) => {
    if (keys.hasOwnProperty(e.key)) { keys[e.key] = true; e.preventDefault(); }
    if (e.key === "q" || e.key === "Q") cameraYaw += 0.15;
    if (e.key === "e" || e.key === "E") cameraYaw -= 0.15;
});
document.addEventListener("keyup", (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

// Mouse drag to rotate camera (desktop)
let isDragging = false;
container.addEventListener("mousedown", (e) => { if (e.button === 0) isDragging = true; });
document.addEventListener("mouseup", () => { isDragging = false; });
document.addEventListener("mousemove", (e) => {
    if (isDragging && !anyModalOpen()) {
        cameraYaw -= e.movementX * 0.005;
    }
});

// ==========================================
// TOUCH CAMERA ROTATION (mobile one-finger drag)
// ==========================================
let touchCamLastX = 0;
container.addEventListener("touchstart", (e) => {
    if (!anyModalOpen()) touchCamLastX = e.touches[0].clientX;
}, { passive: true });
container.addEventListener("touchmove", (e) => {
    if (anyModalOpen() || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchCamLastX;
    cameraYaw -= dx * 0.007;
    touchCamLastX = e.touches[0].clientX;
}, { passive: true });

// ==========================================
// VIRTUAL JOYSTICK EVENT HANDLERS (mobile)
// ==========================================
if (joystickZone) {
    joystickZone.addEventListener("pointerdown", (e) => {
        joystickActive = true;
        const rect = joystickZone.getBoundingClientRect();
        joystickOriginX = rect.left + rect.width / 2;
        joystickOriginY = rect.top + rect.height / 2;
        joystickZone.setPointerCapture(e.pointerId);
        e.preventDefault();
    });

    joystickZone.addEventListener("pointermove", (e) => {
        if (!joystickActive) return;
        let dx = e.clientX - joystickOriginX;
        let dy = e.clientY - joystickOriginY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > JOYSTICK_MAX_RADIUS) {
            dx = (dx / dist) * JOYSTICK_MAX_RADIUS;
            dy = (dy / dist) * JOYSTICK_MAX_RADIUS;
        }
        joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
        joystickDirX = dx / JOYSTICK_MAX_RADIUS;
        joystickDirY = dy / JOYSTICK_MAX_RADIUS;
    });

    const resetJoystick = () => {
        joystickActive = false;
        joystickDirX = 0;
        joystickDirY = 0;
        joystickThumb.style.transform = "translate(0px, 0px)";
    };
    joystickZone.addEventListener("pointerup", resetJoystick);
    joystickZone.addEventListener("pointercancel", resetJoystick);
}

// ==========================================
// NAV LINE (3D dashed line)
// ==========================================
let navLineMesh = null;

function updateNavLine() {
    if (navLineMesh) { scene.remove(navLineMesh); navLineMesh = null; }
    if (!navTarget) return;

    const px = charGroup.position.x, pz = charGroup.position.z;
    const tx = navTarget.x, tz = navTarget.z;
    const dist = Math.sqrt((tx - px) ** 2 + (tz - pz) ** 2);

    if (dist < 2) {
        showNotification(`Arrived at ${navTarget.name}!`);
        navTarget = null;
        return;
    }

    const points = [];
    const segments = Math.floor(dist / 0.6);
    for (let i = 0; i < segments; i++) {
        const t = i / segments;
        if (i % 2 === 0) {
            const t2 = Math.min((i + 1) / segments, 1);
            points.push(new THREE.Vector3(px + (tx - px) * t, 0.1, pz + (tz - pz) * t));
            points.push(new THREE.Vector3(px + (tx - px) * t2, 0.1, pz + (tz - pz) * t2));
        }
    }
    if (points.length >= 2) {
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
        navLineMesh = new THREE.LineSegments(geo, mat);
        scene.add(navLineMesh);
    }
}

// ==========================================
// ZONE DETECTION
// ==========================================
function checkZones() {
    const px = charGroup.position.x;
    const pz = charGroup.position.z;
    let found = null;

    for (const z of zoneMeshes) {
        if (px > z.x - z.w / 2 && px < z.x + z.w / 2 &&
            pz > z.z - z.d / 2 && pz < z.z + z.d / 2) {
            found = z;
            break;
        }
    }

    if (found) {
        currentZoneName = found.name;
        if (found.type === "store") {
            const shopHint = ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 'Tap to shop' : 'Press ENTER to shop';
            zonePrompt.textContent = `🛍️ ${found.name} — ${shopHint}`;
        } else {
            zonePrompt.textContent = `📍 ${found.name}`;
        }
        zonePrompt.classList.add("active");
    } else {
        currentZoneName = null;
        zonePrompt.classList.remove("active");
        if (!shopModal.classList.contains("active")) activeStore = null;
    }
}

// ==========================================
// ANIMATION LOOP
// ==========================================
let walkTime = 0;

function animate() {
    requestAnimationFrame(animate);

    // Update nav line
    updateNavLine();

    // Skip movement if modal is open
    if (anyModalOpen()) {
        leftLegGroup.rotation.x *= 0.9;
        rightLegGroup.rotation.x *= 0.9;
        leftArmGroup.rotation.x *= 0.9;
        rightArmGroup.rotation.x *= 0.9;
        renderer.render(scene, camera);
        return;
    }

    // Movement
    let forward = 0, right = 0;
    if (keys.w || keys.ArrowUp) forward += 1;
    if (keys.s || keys.ArrowDown) forward -= 1;
    if (keys.a || keys.ArrowLeft) right += 1;
    if (keys.d || keys.ArrowRight) right -= 1;
    // Mobile joystick — screen-up = camera-forward, screen-right = camera-right
    if (joystickActive) {
        forward -= joystickDirY;  // dy < 0 (up)    → positive forward
        right -= joystickDirX;   // dx > 0 (right)  → negative right (matches ArrowRight)
    }

    const isWalking = forward !== 0 || right !== 0;

    if (isWalking) {
        const dir = new THREE.Vector3(
            Math.sin(cameraYaw) * forward + Math.cos(cameraYaw) * right,
            0,
            Math.cos(cameraYaw) * forward - Math.sin(cameraYaw) * right
        );
        if (dir.length() > 0) {
            dir.normalize();

            // Check bounds
            const nextX = charGroup.position.x + dir.x * PLAYER_SPEED;
            const nextZ = charGroup.position.z + dir.z * PLAYER_SPEED;

            // Simple building collision
            let blocked = false;
            for (const z of mapZones) {
                if (nextX > z.x - z.w / 2 - 0.4 && nextX < z.x + z.w / 2 + 0.4 &&
                    nextZ > z.z - z.d / 2 - 0.4 && nextZ < z.z + z.d / 2 + 0.4) {
                    // Allow entering the zone area but not through buildings
                    // Only block if deep inside
                    const insideX = nextX > z.x - z.w / 2 + 0.3 && nextX < z.x + z.w / 2 - 0.3;
                    const insideZ = nextZ > z.z - z.d / 2 + 0.3 && nextZ < z.z + z.d / 2 - 0.3;
                    if (insideX && insideZ) { blocked = true; break; }
                }
            }

            if (!blocked && nextX > -50 && nextX < 50 && nextZ > -35 && nextZ < 35) {
                charGroup.position.x = nextX;
                charGroup.position.z = nextZ;
            }

            // Rotate character to face movement direction
            const targetRot = Math.atan2(dir.x, dir.z);
            let diff = targetRot - charGroup.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            charGroup.rotation.y += diff * 0.15;
        }

        walkTime += 0.15;
        // Walk animation
        leftLegGroup.rotation.x = Math.sin(walkTime) * 0.6;
        rightLegGroup.rotation.x = Math.sin(walkTime + Math.PI) * 0.6;
        leftArmGroup.rotation.x = Math.sin(walkTime + Math.PI) * 0.5;
        rightArmGroup.rotation.x = Math.sin(walkTime) * 0.5;
        charGroup.position.y = Math.abs(Math.sin(walkTime * 2)) * 0.06;
    } else {
        walkTime = 0;
        leftLegGroup.rotation.x *= 0.85;
        rightLegGroup.rotation.x *= 0.85;
        leftArmGroup.rotation.x *= 0.85;
        rightArmGroup.rotation.x *= 0.85;
        charGroup.position.y *= 0.85;
    }

    // Camera — third person
    const camDist = 7;
    const camHeight = 4.5;
    const camX = charGroup.position.x - Math.sin(cameraYaw) * camDist;
    const camZ = charGroup.position.z - Math.cos(cameraYaw) * camDist;
    camera.position.set(camX, charGroup.position.y + camHeight, camZ);
    camera.lookAt(
        charGroup.position.x,
        charGroup.position.y + 2,
        charGroup.position.z
    );

    // Zone detection
    checkZones();

    renderer.render(scene, camera);
}

animate();
