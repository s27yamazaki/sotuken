import { menuConfig, storeConfig } from "./config/menu-config.js";

import { homeConfig } from "./config/menu-config.js";

const app = document.querySelector("#app");

const state = {
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
  quantity: 1,
  cartItems: [],
};

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
  state.history = state.history.filter((screen) => screen !== "detail");
  render();
}

function checkoutBar() {
  const count = cartItemCount();
  if (count === 0) return "";
  return '<section class="checkout-bar"><div class="checkout-handle"></div><div class="checkout-cart"><span class="cart-icon">🛒</span><span class="cart-count">' + count + '</span></div><strong>' + yen(cartTotalPrice()) + '</strong><button class="primary checkout-button" data-action="checkout">レジに進む</button></section>';
}

function go(screen) {
  state.history.push(state.screen);
  state.screen = screen;
  render();
}

function back() {
  state.screen = state.history.pop() || "home";
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
    ["delivery", "デリバリー", "▱", "delivery"],
    ["order", "オーダー", "M", "store"],
  ];
  return '<nav class="bottom-nav">' + items.map((item) => {
    return '<button class="nav-item ' + (active === item[0] ? 'is-active' : '') + '" data-action="' + item[3] + '"><span>' + item[2] + '</span>' + item[1] + '</button>';
  }).join("") + '</nav>';
}

function homeScreen() {
  return '<main class="home-page">' +
    '<header class="home-brand"><h1>' + homeConfig.storeName + '</h1></header>' +
    '<section class="home-order-section"><h2>ご注文はこちら</h2><div class="home-order-list">' +
      '<button class="home-order-card is-order" data-action="store"><span><strong>オーダー</strong><small>店頭で受け取る</small></span><span class="home-card-arrow" aria-hidden="true">›</span></button>' +
      '<button class="home-order-card is-delivery" data-action="delivery"><span><strong>デリバリー</strong><small>ご指定先へお届け</small></span><span class="home-card-arrow" aria-hidden="true">›</span></button>' +
    '</div></section>' +
    '<section class="home-info-section"><h2>営業時間</h2><p>' + homeConfig.businessHours + '</p></section>' +
    '<section class="home-social-section"><h2>公式SNS</h2><div class="home-social-links">' +
      '<a href="' + homeConfig.socialLinks.instagram + '" target="_blank" rel="noopener noreferrer" aria-label="Instagramを新しいタブで開く"><span class="social-icon social-instagram" aria-hidden="true">IG</span><span>Instagram</span></a>' +
      '<a href="' + homeConfig.socialLinks.facebook + '" target="_blank" rel="noopener noreferrer" aria-label="Facebookを新しいタブで開く"><span class="social-icon social-facebook" aria-hidden="true">f</span><span>Facebook</span></a>' +
    '</div></section>' +
  '</main>' + bottomNav("home");
}

function storeCard(store, options = {}) {
  const tag = options.static ? "div" : "button";
  const attrs = options.static ? "" : ' data-action="select-store" data-id="' + store.id + '"';
  const note = store.note ? '<span class="pill">' + store.note + '</span>' : '';
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

function categoryTabs() {
  return '<nav class="category-tabs">' + menuConfig.categories.map((category) => {
    return '<button class="' + (category.id === state.selectedCategoryId ? 'is-active' : '') + '" data-action="category" data-id="' + category.id + '">' + category.label + '</button>';
  }).join("") + '</nav>';
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
  return '<section class="cart-summary"><h2>ご注文内容</h2>' + itemRows + '<div class="cart-summary-total"><span>合計</span><strong>' + yen(cartTotalPrice()) + '</strong></div></section>';
}

function cartScreen() {
  const isDelivery = state.orderType === "delivery";
  const storeSection = isDelivery ? "" : '<section class="section-block"><h2>受け取り予定の店舗</h2>' + storeCard(selectedStore(), { static: true }) + '</section>';
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
    '<section class="confirm-actions"><button class="primary" data-action="complete">注文を確定</button><button class="outline" data-action="cart">注文をキャンセル</button></section>' +
    '<section class="section-block"><h2>支払い方法</h2><p><strong>' + state.selectedPayment + '</strong></p></section>' +
    '<section class="section-block"><h2>' + storeHeading + '</h2>' + storeCard(selectedStore(), { static: true }) + '</section>' + cartSummary();
}

function completeScreen() {
  return topBar("注文完了", {}) +
    '<section class="complete"><strong>注文が完了しました</strong><p>これは研究用シミュレータのため、実際の注文は行われません。</p><p class="order-number">A-001</p><button class="primary" data-action="complete-home">ホームへ戻る</button></section>';
}

function renderScreen() {
  if (state.screen === "home") return homeScreen();
  if (state.screen === "store") return storeScreen();
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

function render() {
  app.innerHTML = '<div class="phone-shell">' + renderScreen() + '</div>';
  restoreCategoryScroll();
  restoreScreenScroll();
}

app.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === "back") back();
  if (action === "home") { state.screen = "home"; state.history = []; render(); }
  if (action === "complete-home") { resetCompletedOrder(); state.screen = "home"; state.history = []; render(); }
  if (action === "store") { state.orderType = "pickup"; go("store"); }
  if (action === "delivery") { state.orderType = "delivery"; go("menu"); }
  if (action === "select-store") { state.orderType = "pickup"; state.selectedStoreId = id; go("menu"); }
  if (action === "category") {
    const categoryTabsElement = button.closest(".category-tabs");
    state.categoryScrollLeft = categoryTabsElement ? categoryTabsElement.scrollLeft : state.categoryScrollLeft;
    state.menuScrollY = window.scrollY;
    state.selectedCategoryId = id;
    render();
  }
  if (action === "select-item") {
    state.menuScrollY = window.scrollY;
    state.selectedItemId = id;
    state.selectedOptions = defaultOptionsForItem(selectedItem());
    state.expandedOptionGroupId = null;
    state.detailScrollY = 0;
    go("detail");
  }
  if (action === "toggle-option") {
    state.detailScrollY = window.scrollY;
    state.expandedOptionGroupId = state.expandedOptionGroupId === button.dataset.groupId ? null : button.dataset.groupId;
    render();
  }
  if (action === "select-option") {
    state.detailScrollY = window.scrollY;
    state.selectedOptions[button.dataset.groupId] = id;
    state.expandedOptionGroupId = null;
    render();
  }
  if (action === "add-cart") addSelectedItemToCart();
  if (action === "checkout") go("cart");
  if (action === "cart-minus") {
    const index = Number(button.dataset.index);
    if (state.cartItems[index] && window.confirm("商品の個数を減らしますか？")) {
      state.cartItems[index].quantity -= 1;
      if (state.cartItems[index].quantity <= 0) state.cartItems.splice(index, 1);
      if (state.cartItems.length === 0) {
        state.screen = "menu";
        render();
        return;
      }
      render();
    }
  }
  if (action === "cart-plus") {
    const index = Number(button.dataset.index);
    if (state.cartItems[index] && window.confirm("商品の個数を増やしますか？")) {
      state.cartItems[index].quantity += 1;
      render();
    }
  }
  if (action === "payment-screen") go("payment");
  if (action === "payment") { state.selectedPayment = id; render(); }
  if (action === "final") go("final");
  if (action === "complete") go("complete");
  if (action === "minus" && state.quantity > 1) { state.quantity -= 1; render(); }
  if (action === "plus") { state.quantity += 1; render(); }
});

app.addEventListener("input", (event) => {
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
