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
