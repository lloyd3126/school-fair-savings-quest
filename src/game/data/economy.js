export const ALLOWANCE_PER_WEEK = 30;
export const PLAN_STEP = 5;
export const STARTING_WEEKLY_PLAN = 50;

export const COLLECTION_CARDS = [
  { id: 'giraffe', name: '長頸鹿', price: 35 },
  { id: 'penguin', name: '企鵝', price: 40 },
  { id: 'frog', name: '青蛙', price: 45 },
  { id: 'sloth', name: '樹懶', price: 50 },
  { id: 'elephant', name: '大象', price: 55 },
  { id: 'owl', name: '貓頭鷹', price: 65 },
];

export const COLLECTION_GOAL = COLLECTION_CARDS.reduce((total, card) => total + card.price, 0);

export const SNACK_OPTIONS = [
  { id: 'none', name: '先不買', price: 0, note: '把錢留給計畫' },
  { id: 'drink', name: '買飲料', price: 10, note: '本週優惠可能調整價格' },
  { id: 'snack', name: '買點心', price: 20, note: '立即享用，會影響存款' },
];

export const WEEKS = [
  {
    event: {
      id: 'sunny_setup',
      title: '晴朗的佈置日',
      description: '天氣很好，戶外佈置任務多給 NT$10。',
      taskBonuses: { decorate: 10 },
      expense: 0,
    },
    tasks: [
      { id: 'sort-cards', name: '整理卡片', reward: 15, cost: 0, condition: '不用材料，收入穩定。' },
      { id: 'decorate', name: '幫忙佈置攤位', reward: 25, cost: 5, condition: '先付 NT$5 買佈置材料。' },
    ],
  },
  {
    event: {
      id: 'rainy_week',
      title: '下雨的星期',
      description: '戶外工作暫停，這週只能選室內任務。',
      taskBonuses: {},
      expense: 0,
    },
    tasks: [
      { id: 'chairs', name: '整理室內桌椅', reward: 15, cost: 0, condition: '室內任務，不用額外花錢。' },
      { id: 'flyers', name: '摺園遊會傳單', reward: 20, cost: 0, condition: '需要多花一點時間，沒有材料費。' },
    ],
  },
  {
    event: {
      id: 'recycling_demand',
      title: '回收紙箱大受歡迎',
      description: '攤位需要回收紙箱，這項任務多給 NT$10。',
      taskBonuses: { recycle: 10 },
      expense: 0,
    },
    tasks: [
      { id: 'sort-cards', name: '整理卡片', reward: 15, cost: 0, condition: '不用材料，收入穩定。' },
      { id: 'recycle', name: '收集回收紙箱', reward: 20, cost: 0, condition: '這週有額外需求，報酬較高。' },
    ],
  },
  {
    event: {
      id: 'supply_cost',
      title: '臨時補充文具',
      description: '班上需要補買標籤和筆，這週先支出 NT$10。',
      taskBonuses: {},
      expense: 10,
    },
    tasks: [
      { id: 'poster', name: '張貼宣傳海報', reward: 25, cost: 0, condition: '報酬較高，不需先墊材料費。' },
      { id: 'restock', name: '協助補貨', reward: 30, cost: 10, condition: '報酬高，但要先付 NT$10 搬運費。' },
    ],
  },
  {
    event: {
      id: 'drink_discount',
      title: '飲料優惠日',
      description: '園遊會飲料試賣，這週飲料只要 NT$5。',
      taskBonuses: {},
      drinkPrice: 5,
      expense: 0,
    },
    tasks: [
      { id: 'clean', name: '整理攤位', reward: 15, cost: 0, condition: '不用材料，收入穩定。' },
      { id: 'guide', name: '協助引導同學', reward: 25, cost: 0, condition: '需要多花一點時間，沒有材料費。' },
    ],
  },
  {
    event: {
      id: 'fair_lights',
      title: '園遊會前最後準備',
      description: '燈飾任務多給 NT$10，這是最後一週能接任務的機會。',
      taskBonuses: { lights: 10 },
      expense: 0,
    },
    tasks: [
      { id: 'pack', name: '收拾攤位道具', reward: 15, cost: 0, condition: '不用材料，收入穩定。' },
      { id: 'lights', name: '掛上園遊會燈飾', reward: 25, cost: 5, condition: '先付 NT$5 買固定燈飾。' },
    ],
  },
];
