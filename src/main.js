import { menuConfig, storeConfig } from "./config/menu-config.js";

import { homeConfig } from "./config/menu-config.js";
import { resolveExperimentSettings } from "./config/experiment-config.js";
import { createMistapTracker } from "./experiment/mistap-tracker.js";
import { evaluateFinalOrder, generateReceptionNumber } from "./experiment/experiment-result.js";

const simulatorBuildId = "js-20261028-diagnostic-2";
const app = document.querySelector("#app");
const runtimeExperimentSettings = resolveExperimentSettings(window.location.search);
const mistapTracker = createMistapTracker(runtimeExperimentSettings);
const yellowFilterEnabled = runtimeExperimentSettings.isExperimentMode && runtimeExperimentSettings.yellowEnabled;
const debugEnabled = new URLSearchParams(window.location.search).get("debug") === "1";
const diagnosticVariants = new Set(["baseline", "panel-off", "category-static", "bottom-nav-nonfixed", "animation-off", "visual-wrapper"]);
const requestedDiagnosticVariant = new URLSearchParams(window.location.search).get("diag") || "baseline";
const diagnosticVariant = debugEnabled && diagnosticVariants.has(requestedDiagnosticVariant) ? requestedDiagnosticVariant : "baseline";
const announcementInterval = 4500;
const deliveryFee = 300;
const loadingDuration = 250;
const screenTransitionDuration = 250;
let announcementTimer = null;
let announcementScrollTimer = null;
let loadingTimer = null;
let isLoading = false;
let screenTransitionTimer = null;
let isScreenTransitioning = false;
let pendingConfirmation = null;

const state = {
  experiment: runtimeExperimentSettings,
  screen: "home",
  history: [],
  orderType: "pickup",
  selectedStoreId: storeConfig.selectedStoreId,
  selectedCategoryId: "recommended",
  categoryScrollLeft: 0,
  menuScrollY: 0,
  detailScrollY: 0,
  selectedItemId: "daily-bento",
  selectedOptions: {},
  expandedOptionGroupId: null,
  selectedPayment: null,
  deliveryAddress: "",
  deliveryPhoneParts: ["", "", ""],
  announcementIndex: 0,
  quantity: 1,
  cartItems: [],
  experimentResult: null,
  copyStatus: "",
};

window.experimentMetrics = Object.freeze({
  getSnapshot: () => mistapTracker.getSnapshot(),
  getTotal: () => mistapTracker.getSnapshot().total,
  getMistapTotal: () => mistapTracker.getSnapshot().mistapTotal,
  getTapTotal: () => mistapTracker.getSnapshot().tapTotal,
  getBackTotal: () => mistapTracker.getSnapshot().backTotal,
  getDurationMs: () => mistapTracker.getSnapshot().durationMs,
  getDurationSeconds: () => mistapTracker.getSnapshot().durationSeconds,
  getFinalOrderCorrect: () => mistapTracker.getSnapshot().finalOrderCorrect,
  getReceptionNumber: () => mistapTracker.getSnapshot().receptionNumber,
  getLogs: () => mistapTracker.getSnapshot().logs,
});

function experimentThemeAttribute() {
  if (!state.experiment.isExperimentMode) return "";
  return ' data-color-scheme="' + state.experiment.color + '"';
}

function diagnosticPatchMarkup(location) {
  if (!debugEnabled) return "";
  return '<div class="diagnostic-color-patch diagnostic-color-patch-' + location + '" aria-label="黄変化診断パッチ ' + location + '"><span class="diagnostic-white">W</span><span class="diagnostic-gray">G</span><span class="diagnostic-black">B</span></div>';
}

function visualRoot() {
  if (debugEnabled && diagnosticVariant === "visual-wrapper") {
    return app.querySelector(".simulator-visual-root") || app;
  }
  return app;
}

function updateDebugPanel() {
  if (!debugEnabled) return;
  const panel = document.querySelector("#simulator-debug-panel");
  if (!panel) return;
  const appStyle = window.getComputedStyle(app);
  const target = visualRoot();
  const targetStyle = window.getComputedStyle(target);
  const rootStyle = window.getComputedStyle(document.documentElement);
  const cssBuildId = rootStyle.getPropertyValue("--simulator-css-build").trim().replace(/^['\"]|['\"]$/g, "") || "未取得";
  const standardFilter = appStyle.filter || "未取得";
  const webkitFilter = appStyle.webkitFilter || appStyle.getPropertyValue("-webkit-filter") || "未取得";
  const svgFilter = document.querySelector("#lens-reference-20-70");
  const matrix = svgFilter?.querySelector("feColorMatrix");
  const errors = window.__simulatorDiagnostics?.errors || [];
  const appRect = app.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const categoryTabsElement = app.querySelector(".category-tabs");
  const categoryStyle = categoryTabsElement ? window.getComputedStyle(categoryTabsElement) : null;
  const viewportHeight = window.visualViewport?.height || window.innerHeight;
  const values = [
    `JS build: ${simulatorBuildId}`,
    `CSS build: ${cssBuildId}`,
    `task: ${state.experiment.task ?? "null"}`,
    `color: ${state.experiment.color ?? "null"}`,
    `yellow: ${state.experiment.yellow ?? "null"}`,
    `valid experiment: ${state.experiment.isExperimentMode}`,
    `screen: ${state.screen}`,
    `diagnostic variant: ${diagnosticVariant}`,
    `viewport: ${window.innerWidth}x${Math.round(viewportHeight)} dpr=${window.devicePixelRatio}`,
    `document scrollHeight: ${document.documentElement.scrollHeight}`,
    `#app rect: ${Math.round(appRect.width)}x${Math.round(appRect.height)} top=${Math.round(appRect.top)}`,
    `#app scroll/client: ${app.scrollHeight}/${app.clientHeight}`,
    `filter target: ${target === app ? "#app" : ".simulator-visual-root"}`,
    `target rect: ${Math.round(targetRect.width)}x${Math.round(targetRect.height)} top=${Math.round(targetRect.top)}`,
    `#app data-filter: ${app.dataset.visionFilter || "none"}`,
    `computed filter: ${standardFilter}`,
    `computed -webkit-filter: ${webkitFilter}`,
    `target data-filter: ${target.dataset.visionFilter || "none"}`,
    `target filter: ${targetStyle.filter || "未取得"}`,
    `target -webkit-filter: ${targetStyle.webkitFilter || targetStyle.getPropertyValue("-webkit-filter") || "未取得"}`,
    `category position: ${categoryStyle?.position || "not-rendered"}`,
    `category background: ${categoryStyle?.backgroundColor || "not-rendered"}`,
    `SVG filter: ${svgFilter ? "present" : "missing"}`,
    `feColorMatrix: ${matrix ? "present" : "missing"}`,
    `JS errors: ${errors.length}`,
  ];
  if (errors.length > 0) values.push(...errors.map((error, index) => `error ${index + 1}: ${error}`));
  panel.textContent = values.join("\n");
}

window.__renderSimulatorDiagnostics = updateDebugPanel;
if (debugEnabled) {
  window.addEventListener("scroll", updateDebugPanel, { passive: true });
  window.addEventListener("resize", updateDebugPanel);
}

function syncVisionFilter() {
  delete app.dataset.visionFilter;
  const wrapper = app.querySelector(".simulator-visual-root");
  if (wrapper) delete wrapper.dataset.visionFilter;
  if (!yellowFilterEnabled) return;
  // WebKit can retain an unfiltered compositing layer when the filter is set
  // before dynamic screen content exists. Re-resolve it after each render.
  void app.offsetWidth;
  visualRoot().dataset.visionFilter = "yellowed";
}

function selectedStore() {
  return storeConfig.stores.find((store) => store.id === state.selectedStoreId);
}

function selectedItem() {
  return menuConfig.items.find((item) => item.id === state.selectedItemId);
}

function selectedOptionGroups() {
  const optionGroupIds = selectedItem().optionGroupIds || [];
  return optionGroupIds.map((groupId) => menuConfig.optionGroups.find((group) => group.id === groupId)).filter(Boolean);
}

function defaultOptionsForItem(item) {
  const optionGroupIds = item.optionGroupIds || [];
  return optionGroupIds.reduce((defaults, groupId) => {
    const group = menuConfig.optionGroups.find((item) => item.id === groupId);
    if (group && group.defaultChoiceId) defaults[group.id] = group.defaultChoiceId;
    return defaults;
  }, {});
}

function selectedOptionDetails() {
  return selectedOptionGroups().flatMap((group) => {
    const choice = group.choices.find((item) => item.id === state.selectedOptions[group.id]);
    if (!choice) return [];
    return [{
      groupId: group.id,
      groupLabel: group.label,
      choiceId: choice.id,
      choiceLabel: choice.label,
      priceDelta: choice.priceDelta,
    }];
  });
}

function optionsComplete() {
  return selectedOptionGroups().every((group) => !group.required || state.selectedOptions[group.id]);
}

function selectedUnitPrice() {
  return selectedItem().price + selectedOptionDetails().reduce((total, option) => total + option.priceDelta, 0);
}

function yen(value) {
  return "¥ " + value.toLocaleString("ja-JP");
}

function cartItemCount() {
  return state.cartItems.reduce((total, cartItem) => total + cartItem.quantity, 0);
}

function cartTotalPrice() {
  return state.cartItems.reduce((total, cartItem) => total + cartItem.unitPrice * cartItem.quantity, 0);
}

function cartQuantityForProduct(productId) {
  return state.cartItems.reduce((total, cartItem) => {
    return total + (cartItem.item.id === productId ? cartItem.quantity : 0);
  }, 0);
}

function orderTotalPrice() {
  return cartTotalPrice() + (state.orderType === "delivery" ? deliveryFee : 0);
}

function resetCompletedOrder() {
  state.cartItems = [];
  state.quantity = 1;
  state.selectedOptions = {};
  state.expandedOptionGroupId = null;
  state.selectedPayment = null;
  state.deliveryAddress = "";
  state.deliveryPhoneParts = ["", "", ""];
  state.menuScrollY = 0;
  state.detailScrollY = 0;
  state.experimentResult = null;
  state.copyStatus = "";
}

function finalizeExperimentOrder() {
  if (!state.experiment.isExperimentMode) {
    mistapTracker.complete();
    return;
  }

  const evaluation = evaluateFinalOrder(state.experiment, {
    orderType: state.orderType,
    storeId: state.selectedStoreId,
    payment: state.selectedPayment,
    cartItems: state.cartItems,
  });
  mistapTracker.complete();
  const metrics = mistapTracker.getSnapshot();
  const receptionNumber = generateReceptionNumber(state.experiment, metrics, evaluation.correct);
  state.experimentResult = {
    correct: evaluation.correct,
    receptionNumber,
  };
  state.copyStatus = "";
  mistapTracker.setFinalResult({ correct: evaluation.correct, receptionNumber });
}

function fallbackCopyText(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, value.length);
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

async function copyReceptionNumber() {
  const receptionNumber = state.experimentResult?.receptionNumber;
  if (!receptionNumber) return;

  let copied = false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(receptionNumber);
      copied = true;
    } catch {
      copied = false;
    }
  }
  if (!copied) copied = fallbackCopyText(receptionNumber);
  state.copyStatus = copied
    ? "コピーしました"
    : "コピーできませんでした。受付番号を選択してコピーしてください。";
  render();
}

function addSelectedItemToCart() {
  const item = selectedItem();
  const options = selectedOptionDetails();
  state.cartItems.push({
    item: { ...item },
    options,
    unitPrice: item.price + options.reduce((total, option) => total + option.priceDelta, 0),
    quantity: state.quantity,
  });
  state.quantity = 1;
  state.selectedOptions = {};
  state.expandedOptionGroupId = null;
  state.detailScrollY = 0;
  state.screen = "menu";
  if (state.history[state.history.length - 1] === "menu") state.history.pop();
  render();
}

function checkoutBar() {
  const count = cartItemCount();
  if (count === 0) return "";
  return '<section class="checkout-bar"><div class="checkout-cart"><span class="cart-icon">🛒</span><span class="cart-count">' + count + '</span></div><strong>' + yen(cartTotalPrice()) + '</strong><button class="primary checkout-button" data-action="checkout">レジに進む</button></section>';
}

function go(screen) {
  state.history.push(state.screen);
  state.screen = screen;
  render();
}

function back() {
  const previousScreen = state.screen;
  const targetScreen = state.history.pop() || "home";
  if (previousScreen === "menu" && ["home", "store", "delivery"].includes(targetScreen)) state.cartItems = [];
  state.screen = targetScreen;
  render();
}

function returnToCart() {
  const cartHistoryIndex = state.history.lastIndexOf("cart");
  if (cartHistoryIndex >= 0) state.history = state.history.slice(0, cartHistoryIndex);
  state.screen = "cart";
  render();
}

function screenScrollPosition(screen) {
  if (screen === "menu") return state.menuScrollY;
  if (screen === "detail") return state.detailScrollY;
  return 0;
}

function runScreenTransition(targetScreen, direction, updateHistory) {
  if (isScreenTransitioning || isLoading) return;
  if (debugEnabled && diagnosticVariant === "animation-off") {
    if (updateHistory === "push") state.history.push(state.screen);
    if (updateHistory === "pop") state.history.pop();
    state.screen = targetScreen;
    render();
    return;
  }
  const currentShell = app.querySelector(".phone-shell");
  if (!currentShell) return;
  const outgoingMarkup = currentShell.outerHTML;
  const outgoingScrollY = window.scrollY;
  if (updateHistory === "push") state.history.push(state.screen);
  if (updateHistory === "pop") state.history.pop();
  state.screen = targetScreen;
  const themeAttribute = experimentThemeAttribute();
  const incomingMarkup = '<div class="phone-shell"' + themeAttribute + '>' + renderScreen() + '</div>';
  const incomingScrollY = screenScrollPosition(targetScreen);
  isScreenTransitioning = true;
  visualRoot().insertAdjacentHTML("beforeend", '<div class="screen-transition screen-transition-' + direction + '"' + themeAttribute + ' style="--screen-transition-duration: ' + screenTransitionDuration + 'ms" aria-hidden="true"><div class="screen-transition-panel screen-transition-outgoing">' + outgoingMarkup + '</div><div class="screen-transition-panel screen-transition-incoming">' + incomingMarkup + '</div></div>');
  syncVisionFilter();
  const transition = app.querySelector(".screen-transition");
  const outgoingPanel = transition.querySelector(".screen-transition-outgoing");
  const incomingPanel = transition.querySelector(".screen-transition-incoming");
  outgoingPanel.scrollTop = outgoingScrollY;
  incomingPanel.scrollTop = incomingScrollY;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => transition.classList.add("is-running"));
  });
  let finished = false;
  const finishTransition = () => {
    if (finished) return;
    finished = true;
    if (screenTransitionTimer) window.clearTimeout(screenTransitionTimer);
    screenTransitionTimer = null;
    isScreenTransitioning = false;
    render();
  };
  incomingPanel.addEventListener("transitionend", finishTransition, { once: true });
  screenTransitionTimer = window.setTimeout(finishTransition, screenTransitionDuration + 80);
}

function goWithScreenTransition(screen, direction = "forward") {
  runScreenTransition(screen, direction, "push");
}

function backWithScreenTransition(direction = "back") {
  const targetScreen = state.history[state.history.length - 1] || "home";
  runScreenTransition(targetScreen, direction, "pop");
}

function showLoadingOverlay(onComplete) {
  if (isLoading) return;
  const phoneShell = app.querySelector(".phone-shell");
  if (!phoneShell) return;
  isLoading = true;
  phoneShell.setAttribute("aria-busy", "true");
  phoneShell.insertAdjacentHTML("beforeend", '<div class="loading-overlay" role="status" aria-live="polite"><span class="loading-spinner" aria-hidden="true"></span><span>読み込み中</span></div>');
  syncVisionFilter();
  loadingTimer = window.setTimeout(() => {
    isLoading = false;
    loadingTimer = null;
    onComplete();
  }, loadingDuration);
}

function confirmationDialogMarkup(message) {
  return '<div class="confirmation-modal" role="presentation"><section class="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-message"><h2 id="confirmation-title">確認</h2><p id="confirmation-message">' + message + '</p><div class="confirmation-dialog-actions"><button class="outline" data-action="cancel-confirmation">キャンセル</button><button class="primary" data-action="accept-confirmation">確定</button></div></section></div>';
}

function setBackgroundInteractionDisabled(disabled) {
  const phoneShell = app.querySelector(".phone-shell");
  if (!phoneShell) return;
  Array.from(phoneShell.children).forEach((child) => {
    if (child.classList.contains("confirmation-modal")) return;
    if (disabled) {
      child.setAttribute("inert", "");
      child.setAttribute("aria-hidden", "true");
    } else {
      child.removeAttribute("inert");
      child.removeAttribute("aria-hidden");
    }
  });
}

function openQuantityConfirmation(type, index, trigger) {
  if (pendingConfirmation) return;
  const phoneShell = app.querySelector(".phone-shell");
  if (!phoneShell) return;
  pendingConfirmation = { type, index, trigger };
  const message = type === "decrease" ? "商品の個数を減らしますか？" : "商品の個数を増やしますか？";
  phoneShell.insertAdjacentHTML("beforeend", confirmationDialogMarkup(message));
  syncVisionFilter();
  setBackgroundInteractionDisabled(true);
  app.querySelector('[data-action="accept-confirmation"]')?.focus();
}

function closeConfirmation({ restoreFocus = true } = {}) {
  const confirmation = pendingConfirmation;
  pendingConfirmation = null;
  app.querySelector(".confirmation-modal")?.remove();
  setBackgroundInteractionDisabled(false);
  if (restoreFocus && confirmation?.trigger?.isConnected) confirmation.trigger.focus();
  return confirmation;
}

function applyQuantityConfirmation(confirmation) {
  const cartItem = state.cartItems[confirmation.index];
  if (!cartItem) return;
  if (confirmation.type === "decrease") {
    cartItem.quantity -= 1;
    mistapTracker.updateQuantity(cartItem.item.id, cartQuantityForProduct(cartItem.item.id), "cart-minus");
    if (cartItem.quantity <= 0) state.cartItems.splice(confirmation.index, 1);
    if (state.cartItems.length === 0) state.screen = "menu";
  } else {
    cartItem.quantity += 1;
    mistapTracker.updateQuantity(cartItem.item.id, cartQuantityForProduct(cartItem.item.id), "cart-plus");
  }
  render();
}

function topBar(title, options = {}) {
  return '<header class="top-bar">' +
    (options.back ? '<button class="icon-button" data-action="back" aria-label="戻る">‹</button>' : '<span></span>') +
    '<h1>' + title + '</h1>' +
    (options.close ? '<button class="close-button" data-action="home" aria-label="閉じる">×</button>' : '<span></span>') +
  '</header>';
}

function visual(type) {
  return '<div class="food-visual visual-' + type + '"><span></span></div>';
}

function bottomNav(active) {
  const items = [
    ["home", "ホーム", "⌂", "home"],
    ["delivery", "デリバリー", "./assets/images/delivery-icon.png", "delivery"],
    ["order", "オーダー", "./assets/images/order-icon.png", "store"],
  ];
  return '<nav class="bottom-nav">' + items.map((item) => {
    const icon = item[2].startsWith("./")
      ? '<img class="nav-item-image" src="' + item[2] + '" alt="" aria-hidden="true" />'
      : '<span class="nav-item-symbol" aria-hidden="true">' + item[2] + '</span>';
    return '<button class="nav-item ' + (active === item[0] ? 'is-active' : '') + '" data-action="' + item[3] + '">' + icon + item[1] + '</button>';
  }).join("") + '</nav>';
}

function announcementCarousel() {
  const announcements = homeConfig.announcements || [];
  if (announcements.length === 0) return "";
  const banners = announcements.map((announcement, index) => {
    const image = announcement.image
      ? '<img src="' + announcement.image + '" alt="" />'
      : '<span class="announcement-placeholder" aria-hidden="true"></span>';
    const label = announcement.label ? '<span class="announcement-label">' + announcement.label + '</span>' : '';
    return '<article class="announcement-banner announcement-banner-' + ((index % 3) + 1) + '">' + image + '<div>' + label + '<strong>' + announcement.title + '</strong><p>' + announcement.subtitle + '</p></div></article>';
  }).join("");
  const dots = announcements.map((announcement, index) => '<button class="announcement-dot ' + (index === state.announcementIndex ? 'is-active' : '') + '" data-action="announcement-dot" data-id="' + index + '" aria-label="' + (index + 1) + '件目のお知らせを表示" aria-current="' + (index === state.announcementIndex ? 'true' : 'false') + '"></button>').join("");
  return '<section class="home-announcement-section" aria-label="店舗からのお知らせ"><h2>店舗からのお知らせ</h2><div class="announcement-track">' + banners + '</div><div class="announcement-dots">' + dots + '</div></section>';
}

function homeScreen() {
  return '<main class="home-page">' +
    '<header class="home-brand"><h1>' + homeConfig.storeName + '</h1></header>' +
    announcementCarousel() +
    '<section class="home-order-section"><h2>ご注文はこちら</h2><div class="home-order-list">' +
      '<button class="home-order-card is-order" data-action="store"><span><strong>オーダー</strong><small>店頭で受け取る</small></span><span class="home-card-arrow" aria-hidden="true">›</span></button>' +
      '<button class="home-order-card is-delivery" data-action="delivery"><span><strong>デリバリー</strong><small>ご指定先へお届け</small></span><span class="home-card-arrow" aria-hidden="true">›</span></button>' +
    '</div></section>' +
    '<section class="home-info-section"><h2>営業時間</h2><p>' + homeConfig.businessHours + '</p></section>' +
    '<section class="home-social-section"><h2>公式SNS</h2><div class="home-social-links">' +
      '<a href="' + homeConfig.socialLinks.instagram + '" target="_blank" rel="noopener noreferrer" aria-label="Instagramを新しいタブで開く"><span class="social-icon social-instagram" aria-hidden="true"><img src="./assets/images/instagram-profile.png" alt="" /></span><span>Instagram</span></a>' +
      '<a href="' + homeConfig.socialLinks.facebook + '" target="_blank" rel="noopener noreferrer" aria-label="Facebookを新しいタブで開く"><span class="social-icon social-facebook" aria-hidden="true">f</span><span>Facebook</span></a>' +
    '</div></section>' +
  '</main>' + bottomNav("home");
}

function storeCard(store, options = {}) {
  const tag = options.static ? "div" : "button";
  const attrs = options.static ? "" : ' data-action="select-store" data-id="' + store.id + '"';
  const note = store.note && !options.hideNote ? '<span class="pill">' + store.note + '</span>' : '';
  const name = store.name ? '<strong>' + store.name + '</strong>' : '';
  const distance = store.distance ? '<span>' + store.distance + '</span>' : '';
  const address = store.address ? '<div class="store-detail"><p>' + store.address + '</p></div>' : '';
  return '<' + tag + ' class="store-card"' + attrs + '>' +
    '<div class="store-heading">' + note + name + distance + '</div>' + address +
  '</' + tag + '>';
}

function storeScreen() {
  return topBar("モバイルオーダー", {}) +
    '<p class="sub-title">ご利用の店舗を選択してください</p>' +
    '<section class="store-sheet"><h2 class="store-list-title">店舗一覧</h2>' + storeConfig.stores.map(storeCard).join("") + '</section>' +
    bottomNav("order");
}

function deliveryScreen() {
  return topBar("デリバリー", {}) +
    '<main class="delivery-start-screen"><h2>デリバリー注文</h2><p>配達料金が加算されます。</p><p>配達対象外の住所が入力された際は、ご注文をキャンセルさせていただきます。</p><button class="primary" data-action="start-delivery">注文開始</button></main>' +
    bottomNav("delivery");
}

function categoryTabs() {
  return '<nav class="category-tabs">' + menuConfig.categories.map((category) => {
    return '<button class="' + (category.id === state.selectedCategoryId ? 'is-active' : '') + '" data-action="category" data-id="' + category.id + '">' + category.label + '</button>';
  }).join("") + diagnosticPatchMarkup("category") + '</nav>';
}

function productCard(item) {
  const tag = item.hasDetail && !item.disabled ? 'button' : 'div';
  const attrs = item.hasDetail && !item.disabled ? ' data-action="select-item" data-id="' + item.id + '"' : '';
  return '<' + tag + ' class="product-card ' + (item.disabled ? 'is-disabled' : '') + '"' + attrs + '>' +
    (item.badge && !item.disabled ? '<span class="badge">' + item.badge + '</span>' : '') +
    '<img class="product-card-image" src="' + item.image + '" alt="' + item.name + '" />' +
    '<strong>' + item.name + '</strong><span class="price">' + yen(item.price) + '</span>' +

    (item.disabled ? '<span class="soldout">販売していません</span>' : '') +
  '</' + tag + '>';
}


function menuScreen() {
  const visibleItems = menuConfig.items.filter((item) => {
    if (state.selectedCategoryId === "recommended") return item.recommended;
    return item.category === state.selectedCategoryId;
  });
  const title = state.orderType === "delivery" ? "デリバリー" : selectedStore().name + "で受け取り";
  return topBar(title, { back: true }) +
    categoryTabs() +
    '<p class="note">※特定店舗の価格が適用されます。</p>' +
    '<section class="product-grid">' + visibleItems.map(productCard).join("") + '</section>' + checkoutBar();
}

function orderBar(primaryText, action, disabled) {
  return '<section class="order-bar"><div class="order-total"><strong>' + yen(selectedUnitPrice() * state.quantity) + '</strong><div class="quantity"><button data-action="minus">−</button><span>' + state.quantity + '</span><button data-action="plus">＋</button></div></div><div class="order-actions"><button class="outline" data-action="back">戻る</button><button class="primary" data-action="' + action + '" ' + (disabled ? 'disabled' : '') + '>' + primaryText + '</button></div></section>';
}

function detailComponentRows(item) {
  const components = item.components || [];
  return components.map((componentName, index) => {
    const changeButton = index === 1 ? '<button class="outline-small">変更</button>' : '';
    const customizeButton = index === 0 ? '<button>カスタマイズ</button>' : '';
    return '<div class="detail-row"><img src="./assets/images/no-image.jpg" alt="画像未設定" class="detail-row-image" /><div><strong>' + componentName + '</strong><a>商品情報詳細</a>' + customizeButton + '</div>' + changeButton + '</div>';
  }).join("");
}

function optionSections() {
  const optionSections = selectedOptionGroups().map((group) => {
    const selectedChoice = group.choices.find((choice) => choice.id === state.selectedOptions[group.id]);
    const selectedPrice = selectedChoice && selectedChoice.priceDelta > 0 ? '<span>＋' + yen(selectedChoice.priceDelta) + '</span>' : '';
    const choices = group.choices.map((choice) => {
      const priceText = choice.priceDelta > 0 ? '<span>＋' + yen(choice.priceDelta) + '</span>' : '';
      return '<button class="option-card ' + (state.selectedOptions[group.id] === choice.id ? 'is-selected' : '') + '" data-action="select-option" data-group-id="' + group.id + '" data-id="' + choice.id + '"><strong>' + choice.label + '</strong>' + priceText + '</button>';
    }).join("");
    const choiceList = state.expandedOptionGroupId === group.id ? '<div class="option-grid">' + choices + '</div>' : '';
    return '<section class="option-group"><div class="option-summary"><div><h2>' + group.label + '</h2><strong>' + (selectedChoice ? selectedChoice.label : "未選択") + '</strong>' + selectedPrice + '</div><button class="outline-small" data-action="toggle-option" data-group-id="' + group.id + '">変更</button></div>' + choiceList + '</section>';
  }).join("");
  return optionSections ? '<div class="option-groups">' + optionSections + '</div>' : '';
}

function detailScreen() {
  const item = selectedItem();
  return topBar(item.name, { back: true }) +
    '<section class="detail-hero"><img src="' + item.image + '" alt="' + item.name + '" class="detail-hero-image" /></section>' +
    '<section class="detail-notes"><p>' + (item.description || '※一部店舗及びデリバリーでは価格が異なります。') + '</p></section>' +
    '<section class="detail-list">' + detailComponentRows(item) + '</section>' +
    optionSections() +
    orderBar("カートに追加", "add-cart", !optionsComplete());
}

function cartSummary() {
  const itemRows = state.cartItems.map((cartItem, index) => {
    const componentLines = (cartItem.item.components || []).map((componentName) => '<p>' + componentName + '</p>').join("");
    const optionLines = (cartItem.options || []).map((option) => '<p>' + option.groupLabel + '：' + option.choiceLabel + (option.priceDelta > 0 ? '（＋' + yen(option.priceDelta) + '）' : '') + '</p>').join("");
    return '<div class="cart-summary-item"><div class="cart-summary-main"><strong>' + cartItem.item.name + '</strong>' + componentLines + optionLines + '<span class="cart-summary-price">' + yen(cartItem.unitPrice) + '</span></div><div class="cart-summary-quantity"><button data-action="cart-minus" data-index="' + index + '">−</button><span>' + cartItem.quantity + '</span><button data-action="cart-plus" data-index="' + index + '">＋</button></div></div>';
  }).join("");
  const deliveryFeeRow = state.orderType === "delivery" ? '<div class="cart-summary-fee"><span>配達料</span><strong>' + yen(deliveryFee) + '</strong></div>' : '';
  return '<section class="cart-summary"><h2>ご注文内容</h2>' + itemRows + deliveryFeeRow + '<div class="cart-summary-total"><span>合計</span><strong>' + yen(orderTotalPrice()) + '</strong></div></section>';
}

function cartScreen() {
  const isDelivery = state.orderType === "delivery";
  const storeSection = isDelivery ? "" : '<section class="section-block"><h2>受け取り予定の店舗</h2>' + storeCard(selectedStore(), { static: true, hideNote: true }) + '</section>';
  const deliveryFields = isDelivery
    ? '<section class="delivery-fields"><h2>配達先情報</h2><p class="delivery-notice">※実験用のため、実際の住所・電話番号は入力しないでください。</p><label>住所<input type="text" name="delivery-address" value="' + state.deliveryAddress + '" autocomplete="street-address" /></label><div class="delivery-phone-field"><span>電話番号</span><div class="delivery-phone-inputs"><input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" data-phone-index="0" value="' + state.deliveryPhoneParts[0] + '" aria-label="電話番号1" autocomplete="tel-area-code" /><span aria-hidden="true">-</span><input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" data-phone-index="1" value="' + state.deliveryPhoneParts[1] + '" aria-label="電話番号2" autocomplete="tel-local-prefix" /><span aria-hidden="true">-</span><input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" data-phone-index="2" value="' + state.deliveryPhoneParts[2] + '" aria-label="電話番号3" autocomplete="tel-local-suffix" /></div></div></section>'
    : "";
  const paymentDisabled = isDelivery && (!state.deliveryAddress.trim() || state.deliveryPhoneParts.some((part) => !part));
  return topBar("ご注文内容の確認", { back: true }) +
    storeSection +
    cartSummary() +
    deliveryFields +
    '<section class="bottom-action"><button class="primary" data-action="payment-screen" ' + (paymentDisabled ? 'disabled' : '') + '>支払い方法を選択</button></section>';
}

function paymentScreen() {
  const payments = ["d払い", "PayPay", "楽天ペイ", "au PAY", "Apple Pay", "クレジットカード"];
  return topBar("支払い方法を選択", { back: true }) +
    '<section class="section-block"><h2>お支払い方法を選択してください</h2><p>受け取り番号が表示されるまで注文は確定しません。</p><div class="payment-grid">' + payments.map((payment) => '<button class="payment-card ' + (state.selectedPayment === payment ? 'is-selected' : '') + '" data-action="payment" data-id="' + payment + '"><strong>' + payment + '</strong></button>').join("") + '</div></section>' +
    '<section class="bottom-action"><button class="primary" data-action="final" ' + (!state.selectedPayment ? 'disabled' : '') + '>確認へ進む</button></section>';
}

function finalScreen() {
  const storeHeading = state.orderType === "delivery" ? "配達予定の店舗" : "受け取り予定の店舗";
  return topBar("注文内容の最終確認", { back: true }) +
    '<section class="section-block"><h2>支払い方法</h2><p><strong>' + state.selectedPayment + '</strong></p></section>' +
    '<section class="section-block"><h2>' + storeHeading + '</h2>' + storeCard(selectedStore(), { static: true }) + '</section>' + cartSummary() +
    '<section class="confirm-actions"><button class="primary" data-action="complete">注文を確定</button><button class="outline" data-action="cart">注文をキャンセル</button></section>';
}

function completeScreen() {
  const receptionNumber = state.experimentResult?.receptionNumber;
  const numberMarkup = receptionNumber
    ? '<div class="experiment-reception"><span>受付番号</span><p class="experiment-reception-number">' + receptionNumber + '</p><p>受付番号をコピーして、Googleフォームに戻って入力欄に貼り付けてください。</p><button class="primary" data-action="copy-reception">受付番号をコピー</button><p class="copy-status" role="status" aria-live="polite" aria-atomic="true">' + state.copyStatus + '</p></div>'
    : '<p class="order-number">A-001</p>';
  return topBar("注文完了", {}) +
    '<section class="complete"><strong>注文が完了しました</strong><p>これは研究用シミュレータのため、実際の注文は行われません。</p>' + numberMarkup + '<button class="primary" data-action="complete-home">ホームへ戻る</button></section>';
}

function renderScreen() {
  if (state.screen === "home") return homeScreen();
  if (state.screen === "store") return storeScreen();
  if (state.screen === "delivery") return deliveryScreen();
  if (state.screen === "menu") return menuScreen();
  if (state.screen === "detail") return detailScreen();
  if (state.screen === "cart") return cartScreen();
  if (state.screen === "payment") return paymentScreen();
  if (state.screen === "final") return finalScreen();
  if (state.screen === "complete") return completeScreen();
  return homeScreen();
}

function restoreCategoryScroll() {
  if (state.screen !== "menu") return;
  const categoryTabsElement = document.querySelector(".category-tabs");
  if (!categoryTabsElement) return;
  categoryTabsElement.scrollLeft = state.categoryScrollLeft;
}

function restoreScreenScroll() {
  if (state.screen === "menu") {
    window.scrollTo(0, state.menuScrollY);
    return;
  }
  if (state.screen === "detail") {
    window.scrollTo(0, state.detailScrollY);
    return;
  }
  window.scrollTo(0, 0);
}

function stopAnnouncementCarousel() {
  if (announcementTimer) window.clearInterval(announcementTimer);
  if (announcementScrollTimer) window.clearTimeout(announcementScrollTimer);
  announcementTimer = null;
  announcementScrollTimer = null;
}

function updateAnnouncementDots() {
  app.querySelectorAll(".announcement-dot").forEach((dot, index) => {
    const isActive = index === state.announcementIndex;
    dot.classList.toggle("is-active", isActive);
    dot.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function showAnnouncement(index, behavior = "smooth") {
  const track = app.querySelector(".announcement-track");
  if (!track) return;
  const banners = Array.from(track.querySelectorAll(".announcement-banner"));
  if (banners.length === 0) return;
  state.announcementIndex = (index + banners.length) % banners.length;
  track.scrollTo({ left: banners[state.announcementIndex].offsetLeft - track.offsetLeft, behavior });
  updateAnnouncementDots();
}

function setupAnnouncementCarousel() {
  const track = app.querySelector(".announcement-track");
  if (!track) return;
  const banners = Array.from(track.querySelectorAll(".announcement-banner"));
  if (banners.length < 1) return;
  showAnnouncement(state.announcementIndex, "auto");
  track.addEventListener("scroll", () => {
    if (announcementScrollTimer) window.clearTimeout(announcementScrollTimer);
    announcementScrollTimer = window.setTimeout(() => {
      const closestIndex = banners.reduce((closest, banner, index) => {
        const bannerPosition = banner.offsetLeft - track.offsetLeft;
        const closestPosition = banners[closest].offsetLeft - track.offsetLeft;
        return Math.abs(track.scrollLeft - bannerPosition) < Math.abs(track.scrollLeft - closestPosition) ? index : closest;
      }, 0);
      state.announcementIndex = closestIndex;
      updateAnnouncementDots();
    }, 80);
  }, { passive: true });
  if (banners.length > 1) {
    announcementTimer = window.setInterval(() => {
      if (state.screen !== "home") {
        stopAnnouncementCarousel();
        return;
      }
      showAnnouncement(state.announcementIndex + 1);
    }, announcementInterval);
  }
}

function render() {
  stopAnnouncementCarousel();
  const screenMarkup = '<div class="phone-shell"' + experimentThemeAttribute() + '>' + renderScreen() + '</div>' + diagnosticPatchMarkup("root");
  app.innerHTML = debugEnabled && diagnosticVariant === "visual-wrapper"
    ? '<div class="simulator-visual-root">' + screenMarkup + '</div>'
    : screenMarkup;
  syncVisionFilter();
  restoreCategoryScroll();
  restoreScreenScroll();
  if (state.screen === "home") setupAnnouncementCarousel();
  updateDebugPanel();
}

app.addEventListener("click", (event) => {
  if (isLoading || isScreenTransitioning) return;
  const button = event.target.closest("button, a[href]");
  if (!button || button.disabled) return;
  const isLink = button.matches("a[href]");
  const action = button.dataset.action || (isLink ? "link" : null);
  if (!action) return;
  if (pendingConfirmation && !["accept-confirmation", "cancel-confirmation"].includes(action)) return;
  const id = button.dataset.id;
  const target = id ? `${action}:${id}` : isLink ? `link:${button.href}` : action;
  const startsMeasurement = state.screen === "home" && (action === "store" || action === "delivery");
  if (startsMeasurement) mistapTracker.start(target);
  mistapTracker.trackTap(target, action === "back", { screen: state.screen });
  if (isLink) return;
  if (action === "back") {
    if (state.screen === "detail" && state.history[state.history.length - 1] === "menu") backWithScreenTransition();
    else back();
  }
  if (action === "home") { state.cartItems = []; state.screen = "home"; state.history = []; render(); }
  if (action === "complete-home") { resetCompletedOrder(); state.screen = "home"; state.history = []; render(); }
  if (action === "announcement-dot") showAnnouncement(Number(id));
  if (action === "store") {
    mistapTracker.selectOrderType("pickup");
    state.cartItems = [];
    state.orderType = "pickup";
    go("store");
  }
  if (action === "delivery") {
    mistapTracker.selectOrderType("delivery");
    state.cartItems = [];
    state.orderType = "delivery";
    go("delivery");
  }
  if (action === "start-delivery") {
    showLoadingOverlay(() => {
      state.orderType = "delivery";
      state.history = ["home"];
      state.screen = "menu";
      render();
    });
  }
  if (action === "select-store") {
    mistapTracker.selectStore(id);
    showLoadingOverlay(() => {
      state.orderType = "pickup";
      state.selectedStoreId = id;
      go("menu");
    });
  }
  if (action === "category") {
    const categoryTabsElement = button.closest(".category-tabs");
    state.categoryScrollLeft = categoryTabsElement ? categoryTabsElement.scrollLeft : state.categoryScrollLeft;
    state.menuScrollY = window.scrollY;
    state.selectedCategoryId = id;
    render();
  }
  if (action === "select-item") {
    mistapTracker.openProduct(id);
    state.menuScrollY = window.scrollY;
    state.selectedItemId = id;
    state.selectedOptions = defaultOptionsForItem(selectedItem());
    state.expandedOptionGroupId = null;
    state.detailScrollY = 0;
    goWithScreenTransition("detail");
  }
  if (action === "toggle-option") {
    state.detailScrollY = window.scrollY;
    state.expandedOptionGroupId = state.expandedOptionGroupId === button.dataset.groupId ? null : button.dataset.groupId;
    render();
  }
  if (action === "select-option") {
    mistapTracker.selectOption(state.selectedItemId, button.dataset.groupId, id);
    state.detailScrollY = window.scrollY;
    state.selectedOptions[button.dataset.groupId] = id;
    state.expandedOptionGroupId = null;
    render();
  }
  if (action === "add-cart") {
    mistapTracker.validateOptionsOnAdd(state.selectedItemId, state.selectedOptions);
    mistapTracker.updateQuantity(state.selectedItemId, cartQuantityForProduct(state.selectedItemId) + state.quantity, "add-to-cart");
    showLoadingOverlay(addSelectedItemToCart);
  }
  if (action === "checkout") showLoadingOverlay(() => go("cart"));
  if (action === "cart-minus") {
    const index = Number(button.dataset.index);
    if (state.cartItems[index]) openQuantityConfirmation("decrease", index, button);
  }
  if (action === "cart-plus") {
    const index = Number(button.dataset.index);
    if (state.cartItems[index]) openQuantityConfirmation("increase", index, button);
  }
  if (action === "cancel-confirmation") closeConfirmation();
  if (action === "accept-confirmation") applyQuantityConfirmation(closeConfirmation({ restoreFocus: false }));
  if (action === "payment-screen") showLoadingOverlay(() => go("payment"));
  if (action === "payment") {
    mistapTracker.selectPayment(id);
    state.selectedPayment = id;
    render();
  }
  if (action === "final") {
    mistapTracker.confirmPayment(state.selectedPayment);
    go("final");
  }
  if (action === "cart") returnToCart();
  if (action === "complete") {
    finalizeExperimentOrder();
    go("complete");
  }
  if (action === "copy-reception") copyReceptionNumber();
  if (action === "minus" && state.quantity > 1) {
    state.quantity -= 1;
    mistapTracker.updateQuantity(state.selectedItemId, cartQuantityForProduct(state.selectedItemId) + state.quantity, "detail-minus");
    render();
  }
  if (action === "plus") {
    state.quantity += 1;
    mistapTracker.updateQuantity(state.selectedItemId, cartQuantityForProduct(state.selectedItemId) + state.quantity, "detail-plus");
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if (!pendingConfirmation) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeConfirmation();
    return;
  }
  if (event.key !== "Tab") return;
  const dialog = app.querySelector(".confirmation-dialog");
  const controls = dialog ? Array.from(dialog.querySelectorAll("button:not(:disabled)")) : [];
  if (controls.length === 0) return;
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

app.addEventListener("input", (event) => {
  if (isLoading || isScreenTransitioning) return;
  if (event.target.name === "delivery-address") state.deliveryAddress = event.target.value;
  if (event.target.dataset.phoneIndex !== undefined) {
    const index = Number(event.target.dataset.phoneIndex);
    const maxLength = index === 0 ? 3 : 4;
    const digits = event.target.value.replace(/\D/g, "").slice(0, maxLength);
    event.target.value = digits;
    state.deliveryPhoneParts[index] = digits;
    if (digits.length === maxLength && index < state.deliveryPhoneParts.length - 1) {
      const nextInput = app.querySelector('[data-phone-index="' + (index + 1) + '"]');
      if (nextInput) nextInput.focus();
    }
  }
  const paymentButton = app.querySelector('[data-action="payment-screen"]');
  if (paymentButton && state.orderType === "delivery") {
    paymentButton.disabled = !state.deliveryAddress.trim() || state.deliveryPhoneParts.some((part) => !part);
  }
});

render();
