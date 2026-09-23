export const storeConfig = {
  selectedStoreId: "omori",
  stores: [
    {
      id: "omori",
      name: "大森町店",
      distance: "831 m",
      address: "東京都大田区大森西 3-20-13",
      note: "最も近い店舗",
    },
    {
      id: "atre",
      name: "アトレ大森店",
      distance: "2.6 km",
      address: "東京都大田区大森北 1-6-16",
      note: "前回ご利用",
    },
  ],
};

export const homeConfig = {
  storeName: "キッチンコロッケ",
  businessHours: "10:00 ～ 20:00",
  socialLinks: {
    instagram: "https://www.instagram.com/ota_croquette/",
    facebook: "https://www.facebook.com/kitchenkorokke/",
  },
};

export const menuConfig = {
  categories: [
    { id: "recommended", label: "おすすめ" },
    { id: "bento", label: "お弁当" },
    { id: "rice", label: "丼もの・カレー" },
    { id: "single", label: "単品" },
  ],
  optionGroups: [
    {
      id: "rice-size",
      label: "ご飯の量",
      required: true,
      defaultChoiceId: "regular",
      choices: [
        { id: "regular", label: "普通盛り", priceDelta: 0 },
        { id: "large", label: "大盛り", priceDelta: 50 },
      ],
    },
    {
      id: "croquette-type",
      label: "コロッケの種類",
      required: true,
      defaultChoiceId: "plain",
      choices: [
        { id: "plain", label: "プレーン", priceDelta: 0 },
        { id: "iso", label: "磯コロッケ", priceDelta: 20 },
        { id: "ume", label: "梅コロッケ", priceDelta: 20 },
      ],
    },
    {
      id: "croquette-sauce",
      label: "コロッケのソース",
      required: true,
      defaultChoiceId: "chuno",
      choices: [
        { id: "worcestershire", label: "ウスターソース", priceDelta: 0 },
        { id: "chuno", label: "中濃ソース", priceDelta: 0 },
      ],
    },
  ],
  items: [
    { id: "daily-bento", category: "bento", name: "日替わり弁当", price: 0, recommended: true, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "croquette-bento", category: "bento", name: "コロッケ弁当", price: 0, hasDetail: true, optionGroupIds: ["rice-size", "croquette-type", "croquette-sauce"] },
    { id: "karaage-bento", category: "bento", name: "からあげ弁当", price: 0, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "hamburg-bento", category: "bento", name: "ハンバーグ弁当", price: 0, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "fried-shrimp-bento", category: "bento", name: "エビフライ弁当", price: 0, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "tonkatsu-bento", category: "bento", name: "とんかつ弁当", price: 0, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "salmon-croquette-bento", category: "bento", name: "鮭コロッケ弁当", price: 0, hasDetail: true, optionGroupIds: ["rice-size", "croquette-type", "croquette-sauce"] },
    { id: "karaage-croquette-bento", category: "bento", name: "からあげコロッケ弁当", price: 0, hasDetail: true, optionGroupIds: ["rice-size", "croquette-type", "croquette-sauce"] },
    { id: "hamburg-croquette-bento", category: "bento", name: "ハンバーグコロッケ弁当", price: 0, hasDetail: true, optionGroupIds: ["rice-size", "croquette-type", "croquette-sauce"] },
    { id: "katsudon", category: "rice", name: "カツ丼", price: 0, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "oyakodon", category: "rice", name: "親子丼", price: 0, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "curry-rice", category: "rice", name: "カレーライス", price: 0, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "croquette-curry", category: "rice", name: "コロッケカレーライス", price: 0, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "karaage-curry", category: "rice", name: "からあげカレーライス", price: 0, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "tonkatsu-curry", category: "rice", name: "とんかつカレーライス", price: 0, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "croquette", category: "single", name: "コロッケ", price: 0, hasDetail: true },
    { id: "iso-croquette", category: "single", name: "磯コロッケ", price: 0, hasDetail: true },
    { id: "ume-croquette", category: "single", name: "梅コロッケ", price: 0, hasDetail: true },
    { id: "croquette-tasting-set", category: "single", name: "コロッケ3種食べ比べセット", price: 0, recommended: true, hasDetail: true },
    { id: "karaage-five", category: "single", name: "からあげ（5個）", price: 0, hasDetail: true },
    { id: "tea", category: "single", name: "お茶", price: 0, hasDetail: true },
    { id: "frozen-croquette", category: "single", name: "持ち帰り用冷凍コロッケ", price: 0, recommended: true, hasDetail: true },
  ],
};
