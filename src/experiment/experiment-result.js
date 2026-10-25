import { experimentAnswerDefaults } from "../config/experiment-config.js";
import { menuConfig } from "../config/menu-config.js";

const conditionCodes = {
  "pastel:0": "A",
  "pastel:1": "B",
  "contrast:0": "C",
  "contrast:1": "D",
};

function defaultOptionsForProduct(productId) {
  const product = menuConfig.items.find((item) => item.id === productId);
  return (product?.optionGroupIds || []).reduce((options, groupId) => {
    const group = menuConfig.optionGroups.find((item) => item.id === groupId);
    if (group?.defaultChoiceId) options[groupId] = group.defaultChoiceId;
    return options;
  }, {});
}

function optionObjectFromCartItem(cartItem) {
  return (cartItem.options || []).reduce((options, option) => {
    options[option.groupId] = option.choiceId;
    return options;
  }, {});
}

function itemKey(productId, options) {
  const optionPart = Object.entries(options)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([groupId, choiceId]) => `${groupId}:${choiceId}`)
    .join("|");
  return `${productId}::${optionPart}`;
}

function addQuantity(map, key, quantity) {
  map.set(key, (map.get(key) || 0) + quantity);
}

function expectedOrderMap(taskDefinition) {
  const result = new Map();
  (taskDefinition?.items || []).forEach((item) => {
    const options = { ...defaultOptionsForProduct(item.productId), ...item.options };
    addQuantity(result, itemKey(item.productId, options), item.quantity);
  });
  return result;
}

function actualOrderMap(cartItems) {
  const result = new Map();
  (cartItems || []).forEach((cartItem) => {
    addQuantity(result, itemKey(cartItem.item.id, optionObjectFromCartItem(cartItem)), cartItem.quantity);
  });
  return result;
}

function compareOrderMaps(expected, actual) {
  const differences = [];
  const keys = new Set([...expected.keys(), ...actual.keys()]);
  keys.forEach((key) => {
    const expectedQuantity = expected.get(key) || 0;
    const actualQuantity = actual.get(key) || 0;
    if (expectedQuantity !== actualQuantity) {
      differences.push({ key, expectedQuantity, actualQuantity });
    }
  });
  return differences;
}

export function evaluateFinalOrder(experimentSettings, orderState) {
  const taskDefinition = experimentSettings?.taskDefinition;
  if (!taskDefinition) return { correct: false, reasons: ["invalid-task"] };

  const reasons = [];
  if (orderState.orderType !== experimentAnswerDefaults.orderType) reasons.push("order-type");
  if (orderState.storeId !== experimentAnswerDefaults.storeId) reasons.push("store");
  if (orderState.payment !== experimentAnswerDefaults.payment) reasons.push("payment");

  const itemDifferences = compareOrderMaps(
    expectedOrderMap(taskDefinition),
    actualOrderMap(orderState.cartItems),
  );
  if (itemDifferences.length > 0) reasons.push("items");

  return {
    correct: reasons.length === 0,
    reasons,
    itemDifferences,
  };
}

function padMinimum(value, minimumDigits) {
  return String(value).padStart(minimumDigits, "0");
}

export function generateReceptionNumber(experimentSettings, metrics, finalOrderCorrect) {
  if (!experimentSettings?.isExperimentMode) return null;
  const conditionCode = conditionCodes[`${experimentSettings.color}:${experimentSettings.yellow}`];
  if (!conditionCode) return null;

  const resultCode = finalOrderCorrect ? "T" : "F";
  const taskCode = String(experimentSettings.task);
  const durationSeconds = Math.round(metrics.durationMs / 1000);
  return `${resultCode}${conditionCode}${taskCode}-${padMinimum(durationSeconds, 3)}-${padMinimum(metrics.tapTotal, 3)}-${padMinimum(metrics.mistapTotal, 2)}-${padMinimum(metrics.backTotal, 2)}`;
}
