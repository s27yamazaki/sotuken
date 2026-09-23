export const storeConfig = {
  selectedStoreId: "umeyashiki",
  stores: [
    {
      id: "umeyashiki",
      name: "梅屋敷店",
      distance: "2.6km",
      address: "東京都大田区大森東4丁目35-8",
      note: "最も近い店舗",
    },
    {
      id: "shin-narashino",
      name: "新習志野店",
      distance: "15km",
      address: "千葉県習志野市芝園2丁目1-1",
      note: "",
    },
    {
      id: "tsudanuma",
      name: "津田沼店",
      distance: "25km",
      address: "千葉県習志野市津田沼2-17-1",
      note: "",
    },
    {
      id: "oshiage",
      name: "押上店",
      distance: "32km",
      address: "東京都墨田区押上1丁目1-2",
      note: "",
    },
  ],
};

export const homeConfig = {
  storeName: "キッチンコロッケ",
  businessHours: "10:00 ～ 20:00",
  announcements: [
    {
      id: "monthly-recommendation",
      title: "今月のお得情報",
      label: "期間限定",
      subtitle: "からあげ弁当のからあげを1個増量中！",
      image: "",
    },
    {
      id: "new-product",
      title: "冷凍コロッケ 通信販売スタート",
      label: "販売開始",
      subtitle: "キッチンコロッケの味をご自宅でも楽しめます",
      image: "",
    },
    {
      id: "limited-menu",
      title: "宴会用オードブル承ります",
      label: "ご予約受付中",
      subtitle: "内容やご予算など、詳しくは店頭スタッフへお尋ねください",
      image: "",
    },
  ],
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
        { id: "iso", label: "磯コロッケ", priceDelta: 10 },
        { id: "ume", label: "梅コロッケ", priceDelta: 10 },
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
    {
      id: "frozen-croquette-type",
      label: "コロッケの種類",
      required: true,
      defaultChoiceId: "plain",
      choices: [
        { id: "plain", label: "プレーン", priceDelta: 0 },
        { id: "iso", label: "磯コロッケ", priceDelta: 50 },
        { id: "ume", label: "梅コロッケ", priceDelta: 50 },
      ],
    },
  ],
  items: [
    { id: "daily-bento", category: "bento", name: "日替わり弁当", price: 780, image: "./assets/images/daily-bento.png", description: "毎日違った内容が5品入っているお弁当です", recommended: true, hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "croquette-bento", category: "bento", name: "コロッケ弁当", price: 630, image: "./assets/images/croquette-bento.png", description: "キッチンコロッケ自慢のコロッケが２枚入ったお弁当です。", hasDetail: true, optionGroupIds: ["rice-size", "croquette-type", "croquette-sauce"] },
    { id: "karaage-bento", category: "bento", name: "からあげ弁当", price: 630, image: "./assets/images/karaage-bento.png", description: "特製の鶏肉の唐揚げのお弁当です。", hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "hamburg-bento", category: "bento", name: "ハンバーグ弁当", price: 730, image: "./assets/images/hamburg-bento.png", description: "デミグラスソースの手作りハンバーグと目玉焼きのお弁当です。", hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "fried-shrimp-bento", category: "bento", name: "エビフライ弁当", price: 1080, image: "./assets/images/fried-shrimp-bento.png", description: "ぷりっぷりっのエビフライが入ったお弁当です。", hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "tonkatsu-bento", category: "bento", name: "とんかつ弁当", price: 780, image: "./assets/images/tonkatsu-bento.png", description: "豚のロースの赤身肉のみを使用したとんかつが入ったお弁当です。", hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "salmon-croquette-bento", category: "bento", name: "鮭コロッケ弁当", price: 730, image: "./assets/images/salmon-croquette-bento.png", description: "コロッケと焼き鮭のお弁当です。", hasDetail: true, optionGroupIds: ["rice-size", "croquette-type", "croquette-sauce"] },
    { id: "karaage-croquette-bento", category: "bento", name: "からあげコロッケ弁当", price: 690, image: "./assets/images/karaage-croquette-bento.png", description: "特製の鶏肉の唐揚げとコロッケのお弁当です。", hasDetail: true, optionGroupIds: ["rice-size", "croquette-type", "croquette-sauce"] },
    { id: "hamburg-croquette-bento", category: "bento", name: "ハンバーグコロッケ弁当", price: 780, image: "./assets/images/hamburg-croquette-bento.png", description: "デミグラスソースの手作りハンバーグとコロッケのお弁当です。", hasDetail: true, optionGroupIds: ["rice-size", "croquette-type", "croquette-sauce"] },
    { id: "katsudon", category: "rice", name: "カツ丼", price: 890, image: "./assets/images/katsudon.png", description: "当店自慢の特製の丼タレでとんかつを卵でとじた丼物です。", hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "shogayaki-don", category: "rice", name: "生姜焼き丼", price: 730, image: "./assets/images/syougayaki.png", description: "オリジナルのタレで炒めた豚肉のしょうが焼きのお弁当です", hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "curry-rice", category: "rice", name: "カレーライス", price: 690, image: "./assets/images/curry-rice.png", description: "当店、特製のカレーライスです。", hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "croquette-curry", category: "rice", name: "コロッケカレーライス", price: 840, image: "./assets/images/croquette-curry.png", description: "キッチンコロッケ自慢のクリーミーなポテトコロッケが添えてあるカレーライスです。", hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "karaage-curry", category: "rice", name: "からあげカレーライス", price: 920, image: "./assets/images/karaage-curry.png", description: "特製の鶏肉の唐揚げが添えてあるカレーライスです。", hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "tonkatsu-curry", category: "rice", name: "とんかつカレーライス", price: 1040, image: "./assets/images/tonkatsu-curry.png", description: "豚のロースの赤身肉のみを使用したとんかつが添えてあるカレーライスです。", hasDetail: true, optionGroupIds: ["rice-size"] },
    { id: "croquette", category: "single", name: "コロッケ", price: 170, image: "./assets/images/croquette.png", description: "なめらかで、クリーミーな、当店オリジナルのプレミアムなポテトコロッケです。", hasDetail: true },
    { id: "iso-croquette", category: "single", name: "磯コロッケ", price: 180, image: "./assets/images/iso-croquette.png", description: "海苔の磯の香りをイメージして青のりが入った、クリーミーで、磯の香のプレミアムなポテトコロッケです。", hasDetail: true },
    { id: "ume-croquette", category: "single", name: "梅コロッケ", price: 180, image: "./assets/images/ume-croquette.png", description: "梅肉が入った、クリーミーで、梅の香のプレミアムなポテトコロッケです。", hasDetail: true },
    { id: "croquette-tasting-set", category: "single", name: "コロッケ3種食べ比べセット", price: 500, image: "./assets/images/no-image.jpg", description: "プレーンコロッケ、磯コロッケ、梅コロッケの食べ比べセットです。", recommended: true, hasDetail: true },
    { id: "root-vegetable-tonjiru", category: "single", name: "根菜と里芋の豚汁", price: 190, image: "./assets/images/tonziru.png", description: "ホットする美味しさの豚汁です。", hasDetail: true },
    { id: "tea", category: "single", name: "お茶", price: 120, image: "./assets/images/tea.png", description: "緑茶350ml", hasDetail: true },
    { id: "frozen-croquette", category: "single", name: "持ち帰り用冷凍コロッケ", price: 850, image: "./assets/images/frozen-croquette.png", description: "当店で販売しているコロッケをご自宅で召し上がっていただけます。", recommended: true, hasDetail: true, optionGroupIds: ["frozen-croquette-type"] },
  ],
};
