export const experimentConfig = {
  defaultConditionId: "pastel-normal",
  conditions: [
    {
      id: "pastel-normal",
      label: "パステル配色 / 黄変なし",
      colorScheme: "pastel",
      visionFilter: "normal",
    },
    {
      id: "pastel-yellowed",
      label: "パステル配色 / 黄変あり",
      colorScheme: "pastel",
      visionFilter: "yellowed",
    },
    {
      id: "contrast-normal",
      label: "高コントラスト / 黄変なし",
      colorScheme: "contrast",
      visionFilter: "normal",
    },
    {
      id: "contrast-yellowed",
      label: "高コントラスト / 黄変あり",
      colorScheme: "contrast",
      visionFilter: "yellowed",
    },
  ],
};

export const experimentTasks = {
  1: {
    id: 1,
    items: [
      {
        productId: "karaage-croquette-bento",
        quantity: 1,
        options: {
          "rice-size": "regular",
          "croquette-type": "iso",
          "croquette-sauce": "chuno",
        },
      },
      { productId: "tea", quantity: 1, options: {} },
    ],
  },
  2: {
    id: 2,
    items: [
      {
        productId: "tonkatsu-bento",
        quantity: 1,
        options: { "rice-size": "large" },
      },
      {
        productId: "ume-croquette",
        quantity: 1,
        options: { "croquette-sauce": "chuno" },
      },
    ],
  },
  3: {
    id: 3,
    items: [
      {
        productId: "croquette-curry",
        quantity: 1,
        options: { "rice-size": "large" },
      },
      { productId: "root-vegetable-tonjiru", quantity: 1, options: {} },
    ],
  },
  4: {
    id: 4,
    items: [
      {
        productId: "shogayaki-don",
        quantity: 1,
        options: { "rice-size": "regular" },
      },
      {
        productId: "croquette",
        quantity: 1,
        options: { "croquette-sauce": "worcestershire" },
      },
    ],
  },
};

export const experimentAnswerDefaults = {
  orderType: "pickup",
  storeId: "umeyashiki",
  payment: "PayPay",
  quantity: 1,
};

const validTaskIds = Object.keys(experimentTasks);
const validColorSchemes = ["pastel", "contrast"];
const validYellowValues = ["0", "1"];

function readValidatedParameter(params, name, validValues, invalidParameters) {
  if (!params.has(name)) return null;

  const value = params.get(name);
  if (validValues.includes(value)) return value;

  invalidParameters.push(name);
  return null;
}

export function resolveExperimentSettings(search = "") {
  const params = new URLSearchParams(search);
  const invalidParameters = [];
  const taskValue = readValidatedParameter(params, "task", validTaskIds, invalidParameters);
  const color = readValidatedParameter(params, "color", validColorSchemes, invalidParameters);
  const yellow = readValidatedParameter(params, "yellow", validYellowValues, invalidParameters);
  const task = taskValue === null ? null : Number(taskValue);
  const hasAnyParameter = ["task", "color", "yellow"].some((name) => params.has(name));
  const isExperimentMode = task !== null && color !== null && yellow !== null;

  return {
    task,
    color,
    yellow,
    yellowEnabled: yellow === "1",
    taskDefinition: task === null ? null : experimentTasks[task],
    conditionId: color && yellow ? `${color}-${yellow === "1" ? "yellowed" : "normal"}` : null,
    hasAnyParameter,
    isExperimentMode,
    invalidParameters,
  };
}
