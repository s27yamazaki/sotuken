import { menuConfig, storeConfig } from "./config/menu-config.js";

const app = document.querySelector("#app");

const state = {
  screen: "home",
  history: [],
  selectedStoreId: storeConfig.selectedStoreId,
  selectedCategoryId: "recommended",
  categoryScrollLeft: 0,
  menuScrollY: 0,
  drinksScrollY: 0,
  selectedItemId: "chicken-muffin-set",
  selectedDrinkId: null,
  selectedUseMethod: null,
  selectedPayment: null,
  quantity: 1,
  cartItems: [],
};

function selectedStore() {
  return storeConfig.stores.find((store) => store.id === state.selectedStoreId);
}

function selectedItem() {
  return menuConfig.items.find((item) => item.id === state.selectedItemId);
}

function selectedDrink() {
  return menuConfig.drinks.find((drink) => drink.id === state.selectedDrinkId);
}

function yen(value) {
  return "¥ " + value.toLocaleString("ja-JP");
}

function cartItemCount() {
  return state.cartItems.reduce((total, cartItem) => total + cartItem.quantity, 0);
}

function cartTotalPrice() {
  return state.cartItems.reduce((total, cartItem) => total + cartItem.item.price * cartItem.quantity, 0);
}

function addSelectedItemToCart() {
  const item = selectedItem();
  state.cartItems.push({
    item: { ...item },
    drink: selectedDrink() ? { ...selectedDrink() } : null,
    quantity: state.quantity,
  });
  state.quantity = 1;
  state.selectedDrinkId = null;
  state.screen = "menu";
  state.history = state.history.filter((screen) => screen !== "detail" && screen !== "drinks");
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
  return '<section class="brand-mark">M</section>' +
    '<section class="notice">公式アプリのお知らせが表示されます</section>' +
    '<section class="point-card"><div><small>ご利用可能なポイント</small><strong>1,601 pt</strong></div><div class="qr">QR</div></section>' +

    '<section class="campaign"><p>期間限定</p><strong>朝メニュー限定フェア</strong><button data-action="store">詳しく見る</button></section>' +
    bottomNav("home");
}

function mapArea() {
  let pins = "";
  for (let i = 0; i < 10; i += 1) {
    pins += '<span class="map-pin" style="left:' + (8 + (i * 17) % 82) + '%;top:' + (12 + (i * 23) % 66) + '%">M</span>';
  }
  return '<div class="map-area">' + pins + '<span class="current-location"></span></div>';
}

function storeCard(store, options = {}) {
  const tag = options.static ? "div" : "button";
  const attrs = options.static ? "" : ' data-action="select-store" data-id="' + store.id + '"';
  return '<' + tag + ' class="store-card"' + attrs + '>' +
    '<div class="store-heading"><span class="pill">' + store.note + '</span><strong>' + store.name + '</strong><span>' + store.distance + '</span></div>' +
    '<div class="store-detail"><img src="./assets/images/no-image.jpg" alt="画像未設定" class="store-photo-image" /><div><p>' + store.address + '</p><small>駅近く、客席1階のみ</small></div></div>' +
  '</' + tag + '>';
}

function storeScreen() {
  return topBar("モバイルオーダー", {}) +
    '<p class="sub-title">ご利用の店舗を選択してください</p>' +
    '<section class="search-row"><div class="search-box">店舗を検索</div><button>絞り込み</button></section>' +
    mapArea() +
    '<section class="store-sheet"><div class="handle"></div><h2 class="store-list-title">店舗一覧</h2>' + storeConfig.stores.map(storeCard).join("") + '</section>' +
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
    '<div class="product-image-placeholder" aria-hidden="true"></div>' +
    '<strong>' + item.name + '</strong><span class="price">' + yen(item.price) + '</span>' +

    (item.disabled ? '<span class="soldout">販売していません</span>' : '') +
  '</' + tag + '>';
}


function deliveryScreen() {
  return topBar("デリバリー", {}) + '<section class="blank-screen"></section>' + bottomNav("delivery");
}
function menuScreen() {
  const visibleItems = menuConfig.items.filter((item) => item.category === state.selectedCategoryId);
  return topBar(selectedStore().name + "で受け取り", { back: true }) +
    categoryTabs() +
    '<p class="note">※特定店舗の価格が適用されます。</p>' +
    '<section class="product-grid">' + visibleItems.map(productCard).join("") + '</section>' + checkoutBar();
}

function orderBar(primaryText, action, disabled) {
  return '<section class="order-bar"><div class="order-total"><strong>' + yen(selectedItem().price * state.quantity) + '</strong><div class="quantity"><button data-action="minus">−</button><span>' + state.quantity + '</span><button data-action="plus">＋</button></div></div><div class="order-actions"><button class="outline" data-action="back">戻る</button><button class="primary" data-action="' + action + '" ' + (disabled ? 'disabled' : '') + '>' + primaryText + '</button></div></section>';
}

function detailComponentRows(item) {
  const components = item.components || [];
  return components.map((componentName, index) => {
    const changeButton = index === 1 ? '<button class="outline-small">変更</button>' : '';
    const customizeButton = index === 0 ? '<button>カスタマイズ</button>' : '';
    return '<div class="detail-row"><img src="./assets/images/no-image.jpg" alt="画像未設定" class="detail-row-image" /><div><strong>' + componentName + '</strong><a>商品情報詳細</a>' + customizeButton + '</div>' + changeButton + '</div>';
  }).join("");
}

function detailScreen() {
  const item = selectedItem();
  const isSetItem = item.itemType !== "single";
  return topBar(item.name, { back: true }) +
    '<section class="detail-hero"><img src="./assets/images/no-image.jpg" alt="画像未設定" class="detail-hero-image" /></section>' +
    '<section class="detail-notes"><p>※一部店舗及びデリバリーでは価格が異なります。</p>' + (isSetItem ? '<p>※セットドリンクをお選びください。</p>' : '') + '</section>' +
    '<section class="detail-list">' + detailComponentRows(item) + '</section>' +
    (isSetItem ? '<section class="choice-preview"><h2>お選びください</h2><div><button data-action="drinks">ドリンクA</button><button data-action="drinks">ドリンクB</button></div></section>' + orderBar("ドリンクを選ぶ", "drinks", false) : orderBar("カートに追加", "add-cart", false));
}

function drinksScreen() {
  return topBar("ドリンクを選択", { back: true }) +
    '<section class="choice-section"><h2>お選びください</h2><div class="drink-grid">' + menuConfig.drinks.map((drink) => {
      return '<button class="drink-card ' + (state.selectedDrinkId === drink.id ? 'is-selected' : '') + '" data-action="select-drink" data-id="' + drink.id + '"><div class="product-image-placeholder" aria-hidden="true"></div><strong>' + drink.name + '</strong></button>';
    }).join("") + '</div></section>' +
    orderBar("カートに追加", "add-cart", !state.selectedDrinkId);
}

function cartSummary() {
  const itemRows = state.cartItems.map((cartItem, index) => {
    const componentLines = (cartItem.item.components || []).map((componentName) => '<p>' + componentName + '</p>').join("");
    const drinkLine = cartItem.item.itemType === "single" ? "" : '<p>ドリンク: ' + (cartItem.drink ? cartItem.drink.name : "未選択") + '</p>';
    return '<div class="cart-summary-item"><div class="cart-summary-main"><strong>' + cartItem.item.name + '</strong>' + componentLines + drinkLine + '<span class="cart-summary-price">' + yen(cartItem.item.price) + '</span></div><div class="cart-summary-quantity"><button data-action="cart-minus" data-index="' + index + '">−</button><span>' + cartItem.quantity + '</span><button data-action="cart-plus" data-index="' + index + '">＋</button></div></div>';
  }).join("");
  return '<section class="cart-summary"><h2>ご注文内容</h2>' + itemRows + '<div class="cart-summary-total"><span>合計</span><strong>' + yen(cartTotalPrice()) + '</strong></div></section>';
}

function cartScreen() {
  return topBar("ご注文内容の確認", { back: true }) +
    '<section class="section-block"><h2>受け取り予定の店舗</h2>' + storeCard(selectedStore(), { static: true }) + '</section>' +
    cartSummary() +
    '<section class="bottom-action"><button class="primary" data-action="method">利用方法を選択</button></section>';
}

function methodScreen() {
  const methods = ["お持ち帰り（カウンター受け取り）", "店内でお食事（カウンター受け取り）"];
  const payments = ["d払い", "PayPay", "楽天ペイ", "au PAY", "Apple Pay", "クレジットカード"];
  return topBar("ご注文内容の確認", { back: true }) +
    '<section class="section-block"><h2>ご利用方法を選択してください</h2><div class="method-grid">' + methods.map((method) => '<button class="method-card ' + (state.selectedUseMethod === method ? 'is-selected' : '') + '" data-action="use-method" data-id="' + method + '"><img src="./assets/images/no-image.jpg" alt="画像未設定" class="method-card-image" /><strong>' + method + '</strong></button>').join("") + '</div></section>' +
    '<section class="section-block muted"><h2>お支払い方法を選択してください</h2><p>受け取り番号が表示されるまで注文は確定しません。</p><div class="payment-grid">' + payments.map((payment) => '<button class="payment-card ' + (state.selectedPayment === payment ? 'is-selected' : '') + '" data-action="payment" data-id="' + payment + '"><strong>' + payment + '</strong></button>').join("") + '</div></section>' +
    '<section class="bottom-action"><button class="primary" data-action="final" ' + (!state.selectedUseMethod || !state.selectedPayment ? 'disabled' : '') + '>確認へ進む</button></section>';
}

function finalScreen() {
  return topBar("できたての商品を受け取る", { back: true }) +
    '<section class="pickup"><h2>ご利用方法</h2><div class="pickup-row"><img src="./assets/images/no-image.jpg" alt="画像未設定" class="pickup-method-image" /><strong>' + state.selectedUseMethod + '</strong><button class="outline-small" data-action="method">変更</button></div><p>※注文を確定するとご利用方法は変更できません。</p></section>' +
    '<section class="confirm-actions"><button class="primary" data-action="complete">注文を確定</button><button class="outline" data-action="cart">注文をキャンセル</button></section>' +
    '<section class="section-block"><h2>受け取り予定の店舗</h2>' + storeCard(selectedStore(), { static: true }) + mapArea() + '</section>' + cartSummary();
}

function completeScreen() {
  return topBar("注文完了", {}) +
    '<section class="complete"><strong>注文が完了しました</strong><p>これは研究用シミュレータのため、実際の注文は行われません。</p><p class="order-number">A-001</p><button class="primary" data-action="home">ホームへ戻る</button></section>';
}

function renderScreen() {
  if (state.screen === "home") return homeScreen();
  if (state.screen === "store") return storeScreen();
  if (state.screen === "delivery") return deliveryScreen();
  if (state.screen === "menu") return menuScreen();
  if (state.screen === "detail") return detailScreen();
  if (state.screen === "drinks") return drinksScreen();
  if (state.screen === "cart") return cartScreen();
  if (state.screen === "method") return methodScreen();
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
  if (state.screen === "drinks") {
    window.scrollTo(0, state.drinksScrollY);
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
  if (action === "store") go("store");
  if (action === "delivery") go("delivery");
  if (action === "select-store") { state.selectedStoreId = id; go("menu"); }
  if (action === "category") {
    const categoryTabsElement = button.closest(".category-tabs");
    state.categoryScrollLeft = categoryTabsElement ? categoryTabsElement.scrollLeft : state.categoryScrollLeft;
    state.menuScrollY = window.scrollY;
    state.selectedCategoryId = id;
    render();
  }
  if (action === "select-item") { state.menuScrollY = window.scrollY; state.selectedItemId = id; state.selectedDrinkId = null; go("detail"); }
  if (action === "drinks") go("drinks");
  if (action === "select-drink") {
    state.drinksScrollY = window.scrollY;
    state.selectedDrinkId = id;
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
  if (action === "method") go("method");
  if (action === "use-method") { state.selectedUseMethod = id; render(); }
  if (action === "payment") { state.selectedPayment = id; render(); }
  if (action === "final") go("final");
  if (action === "complete") go("complete");
  if (action === "minus" && state.quantity > 1) { state.quantity -= 1; render(); }
  if (action === "plus") { state.quantity += 1; render(); }
});

render();