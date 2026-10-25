import { experimentAnswerDefaults } from "../config/experiment-config.js";

export function createMistapTracker(experimentSettings, now = () => performance.now()) {
  const taskDefinition = experimentSettings?.taskDefinition || null;
  const enabled = Boolean(taskDefinition);
  const expectedItems = new Map(
    (taskDefinition?.items || []).map((item) => [item.productId, item]),
  );
  const optionErrorStates = new Map();
  const quantityErrorStates = new Map();
  const logs = [];
  let mistapTotal = 0;
  let tapTotal = 0;
  let backTotal = 0;
  let started = false;
  let completed = false;
  let startTime = null;
  let endTime = null;
  let deliveryErrorActive = false;
  let storeErrorActive = false;
  let paymentErrorActive = false;

  function isRunning() {
    return enabled && started && !completed;
  }

  function elapsedMs(at = now()) {
    if (!started) return 0;
    const endpoint = completed && endTime !== null ? endTime : at;
    return Math.max(0, endpoint - startTime);
  }

  function appendLog(entry, at = now()) {
    logs.push({
      timestamp: new Date().toISOString(),
      elapsedMs: elapsedMs(at),
      ...entry,
    });
  }

  function recordEvaluation(action, target, counted, reason, details = {}) {
    if (!isRunning()) return;
    if (counted) mistapTotal += 1;
    appendLog({
      type: "mistap-evaluation",
      action,
      target,
      counted,
      reason,
      mistapTotal,
      ...details,
    });
  }

  function start(target) {
    if (!enabled || started || completed) return false;
    startTime = now();
    started = true;
    appendLog({
      type: "lifecycle",
      action: "start",
      target,
      counted: false,
      reason: "measurement-started",
      mistapTotal,
      tapTotal,
      backTotal,
    }, startTime);
    return true;
  }

  function trackTap(target, isBack = false, details = {}) {
    if (!isRunning()) return;
    tapTotal += 1;
    if (isBack) backTotal += 1;
    appendLog({
      type: "interaction",
      action: isBack ? "back" : "tap",
      target,
      counted: true,
      reason: isBack ? "tap-and-back-counted" : "tap-counted",
      mistapTotal,
      tapTotal,
      backTotal,
      ...details,
    });
  }

  function expectedItem(productId) {
    return expectedItems.get(productId) || null;
  }

  function optionKey(productId, groupId) {
    return `${productId}:${groupId}`;
  }

  function hasIncorrectOrderContext() {
    return deliveryErrorActive || storeErrorActive;
  }

  function selectOrderType(orderType) {
    if (!isRunning()) return;
    if (orderType === experimentAnswerDefaults.orderType) {
      deliveryErrorActive = false;
      recordEvaluation("select-order-type", orderType, false, "corrected-order-type");
      return;
    }
    const counted = !deliveryErrorActive;
    deliveryErrorActive = true;
    recordEvaluation("select-order-type", orderType, counted, counted ? "incorrect-order-type" : "incorrect-order-type-already-counted");
  }

  function selectStore(storeId) {
    if (!isRunning()) return;
    if (storeId === experimentAnswerDefaults.storeId) {
      storeErrorActive = false;
      recordEvaluation("select-store", storeId, false, "corrected-store");
      return;
    }
    const counted = !storeErrorActive;
    storeErrorActive = true;
    recordEvaluation("select-store", storeId, counted, counted ? "incorrect-store" : "incorrect-store-already-counted");
  }

  function openProduct(productId) {
    if (!isRunning()) return;
    if (hasIncorrectOrderContext()) {
      recordEvaluation("open-product", productId, false, "ignored-in-incorrect-order-context");
      return;
    }
    const isExpected = expectedItems.has(productId);
    recordEvaluation("open-product", productId, !isExpected, isExpected ? "expected-product" : "unexpected-product");
  }

  function selectOption(productId, groupId, choiceId) {
    if (!isRunning()) return;
    if (hasIncorrectOrderContext()) {
      recordEvaluation("select-option", `${productId}:${groupId}:${choiceId}`, false, "ignored-in-incorrect-order-context");
      return;
    }
    const item = expectedItem(productId);
    if (!item) {
      recordEvaluation("select-option", `${productId}:${groupId}:${choiceId}`, false, "option-on-unexpected-product");
      return;
    }

    const expectedChoiceId = item.options[groupId];
    if (expectedChoiceId === undefined) {
      recordEvaluation("select-option", `${productId}:${groupId}:${choiceId}`, false, "unscored-option");
      return;
    }

    const key = optionKey(productId, groupId);
    if (choiceId === expectedChoiceId) {
      optionErrorStates.set(key, false);
      recordEvaluation("select-option", `${productId}:${groupId}:${choiceId}`, false, "corrected-option");
      return;
    }

    const counted = !optionErrorStates.get(key);
    optionErrorStates.set(key, true);
    recordEvaluation("select-option", `${productId}:${groupId}:${choiceId}`, counted, counted ? "incorrect-option" : "incorrect-option-already-counted", { expectedChoiceId });
  }

  function validateOptionsOnAdd(productId, selectedOptions) {
    if (!isRunning()) return;
    if (hasIncorrectOrderContext()) {
      recordEvaluation("validate-options-on-add", productId, false, "ignored-in-incorrect-order-context");
      return;
    }
    const item = expectedItem(productId);
    if (!item) {
      recordEvaluation("validate-options-on-add", productId, false, "unexpected-product-already-scored-on-open");
      return;
    }

    Object.entries(item.options).forEach(([groupId, expectedChoiceId]) => {
      const actualChoiceId = selectedOptions[groupId];
      const key = optionKey(productId, groupId);
      if (actualChoiceId === expectedChoiceId) {
        optionErrorStates.set(key, false);
        recordEvaluation("validate-option-on-add", `${productId}:${groupId}:${actualChoiceId}`, false, "correct-option-on-add");
        return;
      }
      const counted = !optionErrorStates.get(key);
      optionErrorStates.set(key, true);
      recordEvaluation("validate-option-on-add", `${productId}:${groupId}:${actualChoiceId ?? "missing"}`, counted, counted ? "incorrect-option-on-add" : "incorrect-option-on-add-already-counted", { expectedChoiceId });
    });
  }

  function updateQuantity(productId, totalQuantity, source) {
    if (!isRunning()) return;
    if (hasIncorrectOrderContext()) {
      recordEvaluation("change-quantity", `${productId}:${totalQuantity}`, false, "ignored-in-incorrect-order-context", { source });
      return;
    }
    const item = expectedItem(productId);
    if (!item) {
      recordEvaluation("change-quantity", `${productId}:${totalQuantity}`, false, "quantity-on-unexpected-product", { source });
      return;
    }

    const expectedQuantity = item.quantity ?? experimentAnswerDefaults.quantity;
    if (totalQuantity <= expectedQuantity) {
      quantityErrorStates.set(productId, false);
      recordEvaluation("change-quantity", `${productId}:${totalQuantity}`, false, "corrected-quantity", { source, expectedQuantity });
      return;
    }

    const counted = !quantityErrorStates.get(productId);
    quantityErrorStates.set(productId, true);
    recordEvaluation("change-quantity", `${productId}:${totalQuantity}`, counted, counted ? "quantity-exceeded" : "quantity-exceeded-already-counted", { source, expectedQuantity });
  }

  function selectPayment(payment) {
    if (!isRunning()) return;
    if (hasIncorrectOrderContext()) {
      recordEvaluation("select-payment", payment, false, "ignored-in-incorrect-order-context");
      return;
    }
    if (payment === experimentAnswerDefaults.payment) {
      paymentErrorActive = false;
      recordEvaluation("select-payment", payment, false, "corrected-payment");
      return;
    }
    const counted = !paymentErrorActive;
    paymentErrorActive = true;
    recordEvaluation("select-payment", payment, counted, counted ? "incorrect-payment" : "incorrect-payment-already-counted");
  }

  function confirmPayment(payment) {
    if (!isRunning()) return;
    if (hasIncorrectOrderContext()) {
      recordEvaluation("confirm-payment", payment || "unselected", false, "ignored-in-incorrect-order-context");
      return;
    }
    if (payment === experimentAnswerDefaults.payment) {
      paymentErrorActive = false;
      recordEvaluation("confirm-payment", payment, false, "correct-payment-confirmed");
      return;
    }
    const counted = !paymentErrorActive;
    paymentErrorActive = true;
    recordEvaluation("confirm-payment", payment || "unselected", counted, counted ? "incorrect-payment-confirmed" : "incorrect-payment-confirmed-already-counted");
  }

  function complete(target = "complete") {
    if (!isRunning()) return;
    endTime = now();
    appendLog({
      type: "lifecycle",
      action: "complete",
      target,
      counted: false,
      reason: "measurement-completed",
      mistapTotal,
      tapTotal,
      backTotal,
    }, endTime);
    completed = true;
  }

  function getSnapshot() {
    const durationMs = elapsedMs();
    return {
      enabled,
      active: isRunning(),
      started,
      completed,
      status: completed ? "completed" : started ? "running" : "not-started",
      task: experimentSettings?.task ?? null,
      total: mistapTotal,
      mistapTotal,
      tapTotal,
      backTotal,
      durationMs,
      durationSeconds: durationMs / 1000,
      logs: logs.map((entry) => ({ ...entry })),
    };
  }

  return {
    start,
    trackTap,
    selectOrderType,
    selectStore,
    openProduct,
    selectOption,
    validateOptionsOnAdd,
    updateQuantity,
    selectPayment,
    confirmPayment,
    complete,
    getSnapshot,
  };
}
