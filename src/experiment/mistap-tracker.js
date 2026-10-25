import { experimentAnswerDefaults } from "../config/experiment-config.js";

export function createMistapTracker(experimentSettings) {
  const taskDefinition = experimentSettings?.taskDefinition || null;
  const expectedItems = new Map(
    (taskDefinition?.items || []).map((item) => [item.productId, item]),
  );
  const optionErrorStates = new Map();
  const quantityErrorStates = new Map();
  const logs = [];
  let total = 0;
  let active = Boolean(taskDefinition);
  let deliveryErrorActive = false;
  let storeErrorActive = false;
  let paymentErrorActive = false;

  function record(action, target, counted, reason, details = {}) {
    if (!active) return;
    if (counted) total += 1;
    logs.push({
      timestamp: new Date().toISOString(),
      action,
      target,
      counted,
      reason,
      total,
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
    if (!active) return;
    if (orderType === experimentAnswerDefaults.orderType) {
      deliveryErrorActive = false;
      record("select-order-type", orderType, false, "corrected-order-type");
      return;
    }
    const counted = !deliveryErrorActive;
    deliveryErrorActive = true;
    record("select-order-type", orderType, counted, counted ? "incorrect-order-type" : "incorrect-order-type-already-counted");
  }

  function selectStore(storeId) {
    if (!active) return;
    if (storeId === experimentAnswerDefaults.storeId) {
      storeErrorActive = false;
      record("select-store", storeId, false, "corrected-store");
      return;
    }
    const counted = !storeErrorActive;
    storeErrorActive = true;
    record("select-store", storeId, counted, counted ? "incorrect-store" : "incorrect-store-already-counted");
  }

  function openProduct(productId) {
    if (!active) return;
    if (hasIncorrectOrderContext()) {
      record("open-product", productId, false, "ignored-in-incorrect-order-context");
      return;
    }
    const isExpected = expectedItems.has(productId);
    record(
      "open-product",
      productId,
      !isExpected,
      isExpected ? "expected-product" : "unexpected-product",
    );
  }

  function selectOption(productId, groupId, choiceId) {
    if (!active) return;
    if (hasIncorrectOrderContext()) {
      record("select-option", `${productId}:${groupId}:${choiceId}`, false, "ignored-in-incorrect-order-context");
      return;
    }
    const item = expectedItem(productId);
    if (!item) {
      record("select-option", `${productId}:${groupId}:${choiceId}`, false, "option-on-unexpected-product");
      return;
    }

    const expectedChoiceId = item.options[groupId];
    if (expectedChoiceId === undefined) {
      record("select-option", `${productId}:${groupId}:${choiceId}`, false, "unscored-option");
      return;
    }

    const key = optionKey(productId, groupId);
    if (choiceId === expectedChoiceId) {
      optionErrorStates.set(key, false);
      record("select-option", `${productId}:${groupId}:${choiceId}`, false, "corrected-option");
      return;
    }

    const counted = !optionErrorStates.get(key);
    optionErrorStates.set(key, true);
    record("select-option", `${productId}:${groupId}:${choiceId}`, counted, counted ? "incorrect-option" : "incorrect-option-already-counted", { expectedChoiceId });
  }

  function validateOptionsOnAdd(productId, selectedOptions) {
    if (!active) return;
    if (hasIncorrectOrderContext()) {
      record("validate-options-on-add", productId, false, "ignored-in-incorrect-order-context");
      return;
    }
    const item = expectedItem(productId);
    if (!item) {
      record("validate-options-on-add", productId, false, "unexpected-product-already-scored-on-open");
      return;
    }

    Object.entries(item.options).forEach(([groupId, expectedChoiceId]) => {
      const actualChoiceId = selectedOptions[groupId];
      const key = optionKey(productId, groupId);
      if (actualChoiceId === expectedChoiceId) {
        optionErrorStates.set(key, false);
        record("validate-option-on-add", `${productId}:${groupId}:${actualChoiceId}`, false, "correct-option-on-add");
        return;
      }
      const counted = !optionErrorStates.get(key);
      optionErrorStates.set(key, true);
      record("validate-option-on-add", `${productId}:${groupId}:${actualChoiceId ?? "missing"}`, counted, counted ? "incorrect-option-on-add" : "incorrect-option-on-add-already-counted", { expectedChoiceId });
    });
  }

  function updateQuantity(productId, totalQuantity, source) {
    if (!active) return;
    if (hasIncorrectOrderContext()) {
      record("change-quantity", `${productId}:${totalQuantity}`, false, "ignored-in-incorrect-order-context", { source });
      return;
    }
    const item = expectedItem(productId);
    if (!item) {
      record("change-quantity", `${productId}:${totalQuantity}`, false, "quantity-on-unexpected-product", { source });
      return;
    }

    const expectedQuantity = item.quantity ?? experimentAnswerDefaults.quantity;
    if (totalQuantity <= expectedQuantity) {
      quantityErrorStates.set(productId, false);
      record("change-quantity", `${productId}:${totalQuantity}`, false, "corrected-quantity", { source, expectedQuantity });
      return;
    }

    const counted = !quantityErrorStates.get(productId);
    quantityErrorStates.set(productId, true);
    record("change-quantity", `${productId}:${totalQuantity}`, counted, counted ? "quantity-exceeded" : "quantity-exceeded-already-counted", { source, expectedQuantity });
  }

  function selectPayment(payment) {
    if (!active) return;
    if (hasIncorrectOrderContext()) {
      record("select-payment", payment, false, "ignored-in-incorrect-order-context");
      return;
    }
    if (payment === experimentAnswerDefaults.payment) {
      paymentErrorActive = false;
      record("select-payment", payment, false, "corrected-payment");
      return;
    }
    const counted = !paymentErrorActive;
    paymentErrorActive = true;
    record("select-payment", payment, counted, counted ? "incorrect-payment" : "incorrect-payment-already-counted");
  }

  function confirmPayment(payment) {
    if (!active) return;
    if (hasIncorrectOrderContext()) {
      record("confirm-payment", payment || "unselected", false, "ignored-in-incorrect-order-context");
      return;
    }
    if (payment === experimentAnswerDefaults.payment) {
      paymentErrorActive = false;
      record("confirm-payment", payment, false, "correct-payment-confirmed");
      return;
    }
    const counted = !paymentErrorActive;
    paymentErrorActive = true;
    record("confirm-payment", payment || "unselected", counted, counted ? "incorrect-payment-confirmed" : "incorrect-payment-confirmed-already-counted");
  }

  function complete() {
    if (!active) return;
    record("complete-experiment", "order", false, "measurement-stopped");
    active = false;
  }

  function getSnapshot() {
    return {
      enabled: Boolean(taskDefinition),
      active,
      task: experimentSettings?.task ?? null,
      total,
      logs: logs.map((entry) => ({ ...entry })),
    };
  }

  return {
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
