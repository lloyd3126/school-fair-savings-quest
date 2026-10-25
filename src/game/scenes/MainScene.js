import Phaser from 'phaser';
import {
  ALLOWANCE_PER_WEEK,
  COLLECTION_CARDS,
  COLLECTION_GOAL,
  PLAN_STEP,
  SNACK_OPTIONS,
  STARTING_WEEKLY_PLAN,
  WEEKS,
} from '../data/economy.js';
import {
  getAvailableMoney,
  getDrinkPrice,
  getRequiredWeeklySaving,
  getTaskOutcome,
  getWalletAfterAllocation,
} from '../systems/BudgetRules.js';
import {
  createEvidenceId,
  flushEvidenceQueue,
  isEvidenceEnabled,
  queueEvidenceRecord,
} from '../systems/LearningEvidence.js';
import { addButton, addImage, addPanel, addProgressBar, addText } from '../ui/draw.js';
import { COLORS, money } from '../ui/theme.js';

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const TOTAL_WEEKS = WEEKS.length;

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
  }

  preload() {
    COLLECTION_CARDS.forEach((card) => {
      this.load.image(
        `card-${card.id}`,
        `${import.meta.env.BASE_URL}assets/images/kenney/animal-pack-remastered/cards/${card.id}.png`,
      );
    });
  }

  create() {
    this.pendingWeeklyPlan = STARTING_WEEKLY_PLAN;
    this.resetRun(this.pendingWeeklyPlan);
    flushEvidenceQueue();
    this.renderIntro();
  }

  resetRun(weeklyPlan) {
    this.run = {
      runId: createEvidenceId('run'),
      startedAt: new Date().toISOString(),
      summaryRecorded: false,
      weekIndex: 0,
      wallet: 0,
      fund: 0,
      weeklyPlan,
      records: [],
      selectedTask: null,
      selectedPurchaseId: 'none',
      deposit: null,
    };
  }

  beginView() {
    if (this.view) this.view.destroy(true);
    this.view = this.add.container(0, 0);
    const background = this.add.graphics();
    background.fillStyle(COLORS.background, 1);
    background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.view.add(background);
  }

  addHeader(title, details = '') {
    addPanel(this, this.view, 24, 14, 912, 58, { fill: COLORS.surface, radius: 18 });
    addText(this, this.view, 44, 25, title, { fontSize: 22, bold: true });
    if (details) {
      addText(this, this.view, 918, 34, details, {
        fontSize: 13,
        color: COLORS.muted,
        align: 'right',
        originX: 1,
      });
    }
  }

  runDetails() {
    return `錢包 ${money(this.run.wallet)}　基金 ${money(this.run.fund)} / ${money(COLLECTION_GOAL)}`;
  }

  renderIntro() {
    this.beginView();
    addText(this, this.view, 38, 24, '園遊會卡片收藏家', { fontSize: 27, bold: true });
    addText(this, this.view, 40, 61, '六週後的園遊會，想收齊這一套動物卡片嗎？', {
      fontSize: 15,
      color: COLORS.muted,
    });
    addPanel(this, this.view, 770, 24, 154, 42, { fill: COLORS.greenPale, stroke: false, radius: 21 });
    addText(this, this.view, 847, 36, `目標 ${money(COLLECTION_GOAL)}`, {
      fontSize: 15,
      bold: true,
      align: 'center',
      originX: 0.5,
    });

    addText(this, this.view, 38, 99, '園遊會限定卡片', { fontSize: 16, bold: true });
    COLLECTION_CARDS.forEach((card, index) => {
      const x = 30 + index * 150;
      addPanel(this, this.view, x, 126, 138, 145, {
        fill: COLORS.surface,
        strokeColor: COLORS.line,
        radius: 16,
      });
      addImage(this, this.view, x + 69, 169, `card-${card.id}`, 58, 58);
      addText(this, this.view, x + 69, 208, card.name, {
        fontSize: 14,
        bold: true,
        align: 'center',
        originX: 0.5,
      });
      addText(this, this.view, x + 69, 235, money(card.price), {
        fontSize: 13,
        color: COLORS.muted,
        align: 'center',
        originX: 0.5,
      });
    });

    addPanel(this, this.view, 30, 291, 900, 125, { fill: COLORS.surfaceAlt, stroke: false, radius: 20 });
    addText(this, this.view, 52, 310, '先訂一個起始計畫', { fontSize: 17, bold: true });
    addText(this, this.view, 52, 340, '平均每週存款', { fontSize: 13, color: COLORS.muted });
    addButton(this, this.view, 52, 365, 42, 38, '−', () => this.changeInitialPlan(-PLAN_STEP), {
      fill: COLORS.surface,
      hoverFill: COLORS.yellowPale,
      textColor: COLORS.ink,
      fontSize: 21,
    });
    addText(this, this.view, 169, 368, money(this.pendingWeeklyPlan), {
      fontSize: 21,
      bold: true,
      align: 'center',
      originX: 0.5,
    });
    addButton(this, this.view, 246, 365, 42, 38, '+', () => this.changeInitialPlan(PLAN_STEP), {
      fill: COLORS.surface,
      hoverFill: COLORS.yellowPale,
      textColor: COLORS.ink,
      fontSize: 21,
    });

    const forecast = this.pendingWeeklyPlan * TOTAL_WEEKS;
    const difference = forecast - COLLECTION_GOAL;
    const forecastMessage = difference >= 0
      ? `六週預計 ${money(forecast)}，比目標多 ${money(difference)}。`
      : `六週預計 ${money(forecast)}，照這份計畫會差 ${money(-difference)}。`;
    addText(this, this.view, 360, 315, forecastMessage, { fontSize: 16, bold: true });
    addText(this, this.view, 360, 345, `固定零用錢每週 ${money(ALLOWANCE_PER_WEEK)}；可選任務增加收入。`, {
      fontSize: 13,
      color: COLORS.muted,
    });
    addText(this, this.view, 360, 370, '每週事件會先揭露；未花的錢留在錢包帶到下週。', {
      fontSize: 13,
      color: COLORS.muted,
    });

    addButton(this, this.view, 326, 438, 308, 54, '開始六週挑戰', () => {
      this.resetRun(this.pendingWeeklyPlan);
      this.renderWeekSelection();
    }, { fill: COLORS.green, hoverFill: COLORS.greenHover, fontSize: 18, radius: 18 });
    addText(this, this.view, 480, 508,
      isEvidenceEnabled()
        ? '遊戲會傳送不含姓名或 Email 的決策紀錄供學習分析。'
        : '用滑鼠點選任務與預算選項', {
      fontSize: 12,
      color: COLORS.muted,
      align: 'center',
      originX: 0.5,
    });
  }

  changeInitialPlan(change) {
    this.pendingWeeklyPlan = Phaser.Math.Clamp(this.pendingWeeklyPlan + change, 5, 100);
    this.renderIntro();
  }

  renderWeekSelection() {
    this.beginView();
    const week = WEEKS[this.run.weekIndex];
    this.addHeader(`第 ${this.run.weekIndex + 1} 週 / ${TOTAL_WEEKS}`, this.runDetails());

    addPanel(this, this.view, 32, 88, 896, 103, { fill: COLORS.yellowPale, stroke: false, radius: 18 });
    addText(this, this.view, 54, 104, '本週事件', { fontSize: 13, bold: true, color: COLORS.navy });
    addText(this, this.view, 54, 126, week.event.title, { fontSize: 19, bold: true });
    addText(this, this.view, 54, 154, week.event.description, {
      fontSize: 14,
      color: COLORS.muted,
      wrapWidth: 660,
    });
    if (week.event.expense > 0) {
      addText(this, this.view, 900, 157, `必要支出 ${money(week.event.expense)}`, {
        fontSize: 13,
        bold: true,
        color: COLORS.coral,
        align: 'right',
        originX: 1,
      });
    }

    const remainingWeeks = TOTAL_WEEKS - this.run.weekIndex;
    const suggested = getRequiredWeeklySaving(this.run.fund, remainingWeeks);
    addText(this, this.view, 34, 204,
      `選一項任務。你的參考存款是每週 ${money(this.run.weeklyPlan)}；依目前進度，平均約需 ${money(suggested)}。`,
      { fontSize: 14, bold: true, color: COLORS.ink });

    week.tasks.forEach((task, index) => {
      const x = 32 + index * 454;
      const outcome = getTaskOutcome(task, week.event);
      addPanel(this, this.view, x, 236, 438, 222, {
        fill: COLORS.surface,
        strokeColor: index === 0 ? COLORS.line : 0xc6d9d1,
        radius: 18,
      });
      addText(this, this.view, x + 22, 254, task.name, { fontSize: 19, bold: true });
      addText(this, this.view, x + 22, 286, task.condition, {
        fontSize: 13,
        color: COLORS.muted,
        wrapWidth: 390,
      });
      addText(this, this.view, x + 22, 324, `任務報酬 ${money(outcome.reward)}`, {
        fontSize: 15,
        bold: true,
        color: COLORS.green,
      });
      if (outcome.cost > 0) {
        addText(this, this.view, x + 22, 350, `先付材料費 ${money(outcome.cost)}`, {
          fontSize: 13,
          color: COLORS.coral,
        });
      }
      if (outcome.bonus > 0) {
        addText(this, this.view, x + 222, 350, `事件加成 +${money(outcome.bonus)}`, {
          fontSize: 13,
          color: COLORS.green,
        });
      }
      addPanel(this, this.view, x + 18, 374, 402, 1, { fill: COLORS.line, stroke: false, radius: 0 });
      addButton(this, this.view, x + 20, 389, 398, 50, `選擇任務（淨收入 ${money(outcome.net)}）`, () => {
        this.chooseTask(task);
      }, {
        fill: index === 0 ? COLORS.navy : COLORS.green,
        hoverFill: index === 0 ? 0x183349 : COLORS.greenHover,
        fontSize: 15,
        radius: 14,
      });
    });

    addText(this, this.view, 480, 486, '先看清報酬、條件和費用，再決定哪項工作符合你的計畫。', {
      fontSize: 12,
      color: COLORS.muted,
      align: 'center',
      originX: 0.5,
    });
  }

  chooseTask(task) {
    this.run.selectedTask = task;
    const week = WEEKS[this.run.weekIndex];
    const available = getAvailableMoney(this.run.wallet, task, week.event);
    const reference = getRequiredWeeklySaving(
      this.run.fund,
      TOTAL_WEEKS - this.run.weekIndex,
    );
    this.run.selectedPurchaseId = 'none';
    this.run.deposit = Math.min(reference || this.run.weeklyPlan, available);
    this.renderBudget();
  }

  currentPurchase() {
    const selected = SNACK_OPTIONS.find((option) => option.id === this.run.selectedPurchaseId) ?? SNACK_OPTIONS[0];
    if (selected.id === 'drink') return { ...selected, price: getDrinkPrice(WEEKS[this.run.weekIndex].event) };
    return selected;
  }

  renderBudget() {
    this.beginView();
    const week = WEEKS[this.run.weekIndex];
    const task = this.run.selectedTask;
    const taskOutcome = getTaskOutcome(task, week.event);
    const available = getAvailableMoney(this.run.wallet, task, week.event);
    const purchase = this.currentPurchase();
    const maxDeposit = Math.max(0, available - purchase.price);
    this.run.deposit = Phaser.Math.Clamp(this.run.deposit ?? 0, 0, maxDeposit);

    this.addHeader(`第 ${this.run.weekIndex + 1} 週：分配預算`, this.runDetails());
    addPanel(this, this.view, 32, 87, 896, 70, { fill: COLORS.yellowPale, stroke: false, radius: 16 });
    addText(this, this.view, 52, 101, `${week.event.title}：${week.event.description}`, {
      fontSize: 14,
      color: COLORS.ink,
      wrapWidth: 850,
    });
    addPanel(this, this.view, 32, 168, 896, 55, { fill: COLORS.bluePale, stroke: false, radius: 14 });
    const costLine = taskOutcome.cost > 0 ? `　材料費 ${money(taskOutcome.cost)}` : '';
    const bonusLine = taskOutcome.bonus > 0 ? `　事件加成 +${money(taskOutcome.bonus)}` : '';
    addText(this, this.view, 52, 185,
      `已選：${task.name}　報酬 ${money(taskOutcome.reward)}${costLine}${bonusLine}　　本週可分配 ${money(available)}`,
      { fontSize: 14, bold: true });

    addPanel(this, this.view, 32, 237, 432, 231, { fill: COLORS.surface, radius: 18 });
    addText(this, this.view, 52, 253, '這週想買什麼？', { fontSize: 17, bold: true });
    const optionLabels = [
      { id: 'none', label: '先不買　NT$0' },
      { id: 'drink', label: `買飲料　${money(getDrinkPrice(week.event))}` },
      { id: 'snack', label: '買點心　NT$20' },
    ];
    optionLabels.forEach((option, index) => {
      const selected = option.id === this.run.selectedPurchaseId;
      const optionPrice = option.id === 'drink'
        ? getDrinkPrice(week.event)
        : (SNACK_OPTIONS.find((item) => item.id === option.id)?.price ?? 0);
      const disabled = optionPrice > available;
      addButton(this, this.view, 52, 284 + index * 52, 390, 43, option.label, () => {
        this.run.selectedPurchaseId = option.id;
        this.renderBudget();
      }, {
        fill: disabled ? COLORS.surfaceAlt : selected ? COLORS.green : COLORS.surfaceAlt,
        hoverFill: selected ? COLORS.greenHover : COLORS.greenPale,
        textColor: selected ? COLORS.surface : COLORS.ink,
        stroke: true,
        strokeColor: selected ? COLORS.green : COLORS.line,
        disabled,
        fontSize: 14,
        radius: 12,
      });
    });

    addPanel(this, this.view, 480, 237, 448, 231, { fill: COLORS.surface, radius: 18 });
    addText(this, this.view, 504, 253, '存進卡片基金', { fontSize: 17, bold: true });
    addText(this, this.view, 504, 280, `本週參考：${money(this.run.weeklyPlan)}　最多可存：${money(maxDeposit)}`, {
      fontSize: 12,
      color: COLORS.muted,
    });
    addButton(this, this.view, 514, 319, 54, 50, '−5', () => {
      this.run.deposit = Math.max(0, this.run.deposit - PLAN_STEP);
      this.renderBudget();
    }, {
      fill: COLORS.surfaceAlt,
      hoverFill: COLORS.yellowPale,
      textColor: COLORS.ink,
      fontSize: 17,
      disabled: this.run.deposit < PLAN_STEP,
    });
    addText(this, this.view, 704, 319, money(this.run.deposit), {
      fontSize: 24,
      bold: true,
      align: 'center',
      originX: 0.5,
    });
    addButton(this, this.view, 840, 319, 54, 50, '+5', () => {
      this.run.deposit = Math.min(maxDeposit, this.run.deposit + PLAN_STEP);
      this.renderBudget();
    }, {
      fill: COLORS.surfaceAlt,
      hoverFill: COLORS.yellowPale,
      textColor: COLORS.ink,
      fontSize: 17,
      disabled: this.run.deposit + PLAN_STEP > maxDeposit,
    });
    const walletAfter = getWalletAfterAllocation(available, this.run.deposit, purchase.price);
    addPanel(this, this.view, 504, 385, 400, 56, { fill: COLORS.greenPale, stroke: false, radius: 13 });
    addText(this, this.view, 524, 402, `結算後留在錢包　${money(walletAfter)}`, {
      fontSize: 15,
      bold: true,
    });

    addButton(this, this.view, 330, 481, 300, 47, '確認本週分配', () => this.finishWeek(), {
      fill: COLORS.green,
      hoverFill: COLORS.greenHover,
      fontSize: 16,
    });
  }

  finishWeek() {
    const weekIndex = this.run.weekIndex;
    const week = WEEKS[weekIndex];
    const task = this.run.selectedTask;
    const outcome = getTaskOutcome(task, week.event);
    const available = getAvailableMoney(this.run.wallet, task, week.event);
    const purchase = this.currentPurchase();
    const deposit = Math.min(this.run.deposit ?? 0, Math.max(0, available - purchase.price));
    const wallet = getWalletAfterAllocation(available, deposit, purchase.price);
    const walletBefore = this.run.wallet;
    const fundBefore = this.run.fund;
    const previousPlan = this.run.weeklyPlan;
    const fund = this.run.fund + deposit;
    const remainingWeeks = TOTAL_WEEKS - (weekIndex + 1);
    const requiredWeeklySaving = getRequiredWeeklySaving(fund, remainingWeeks);

    const record = {
      eventId: createEvidenceId('decision'),
      runId: this.run.runId,
      eventCode: week.event.id,
      taskId: task.id,
      weekNumber: weekIndex + 1,
      eventTitle: week.event.title,
      eventExpense: week.event.expense ?? 0,
      allowance: ALLOWANCE_PER_WEEK,
      walletBefore,
      taskName: task.name,
      taskReward: outcome.reward,
      taskCost: outcome.cost,
      taskBonus: outcome.bonus,
      purchaseName: purchase.name,
      purchaseId: purchase.id,
      purchaseCost: purchase.price,
      deposit,
      plannedDeposit: previousPlan,
      requiredWeeklySaving,
      remainingWeeks,
      wallet,
      fundBefore,
      fund,
      available,
    };

    this.run.wallet = wallet;
    this.run.fund = fund;
    this.run.records.push(record);
    queueEvidenceRecord({
      type: 'weeklyDecision',
      eventId: record.eventId,
      runId: record.runId,
      weekNumber: record.weekNumber,
      eventCode: record.eventCode,
      taskId: record.taskId,
      walletBefore: record.walletBefore,
      allowance: record.allowance,
      taskReward: record.taskReward,
      taskBonus: record.taskBonus,
      taskCost: record.taskCost,
      eventExpense: record.eventExpense,
      availableAmount: record.available,
      plannedDeposit: record.plannedDeposit,
      deposit: record.deposit,
      purchaseId: record.purchaseId,
      purchaseCost: record.purchaseCost,
      walletAfter: record.wallet,
      fundBefore: record.fundBefore,
      fundAfter: record.fund,
      remainingWeeks: record.remainingWeeks,
      requiredWeeklySaving: record.requiredWeeklySaving,
    });
    this.run.weekIndex += 1;
    this.run.selectedTask = null;
    this.run.selectedPurchaseId = 'none';
    this.run.deposit = null;
    if (this.run.weekIndex < TOTAL_WEEKS) {
      this.run.weeklyPlan = getRequiredWeeklySaving(
        this.run.fund,
        TOTAL_WEEKS - this.run.weekIndex,
      );
    }
    this.renderWeekResult(record);
  }

  renderWeekResult(record) {
    this.beginView();
    this.addHeader(`第 ${record.weekNumber} 週結算`, this.runDetails());
    addPanel(this, this.view, 40, 90, 880, 321, { fill: COLORS.surface, radius: 20 });
    addText(this, this.view, 68, 112, record.eventTitle, { fontSize: 20, bold: true });
    addText(this, this.view, 68, 146, `任務：${record.taskName}　報酬 ${money(record.taskReward)}${record.taskCost ? `，材料費 ${money(record.taskCost)}` : ''}`, {
      fontSize: 15,
    });
    const incomeAndEvent = `固定零用錢 +${money(record.allowance)}${record.eventExpense > 0 ? `　　事件必要支出 −${money(record.eventExpense)}` : ''}`;
    addText(this, this.view, 68, 178, incomeAndEvent, {
      fontSize: 14,
      color: COLORS.muted,
    });
    const purchaseSummary = record.purchaseCost > 0
      ? `${record.purchaseName} −${money(record.purchaseCost)}`
      : record.purchaseName;
    addText(this, this.view, 68, 207, `消費：${purchaseSummary}`, {
      fontSize: 14,
      color: COLORS.muted,
    });
    addPanel(this, this.view, 68, 244, 824, 1, { fill: COLORS.line, stroke: false, radius: 0 });
    addText(this, this.view, 68, 263, `存入卡片基金 +${money(record.deposit)}`, {
      fontSize: 17,
      bold: true,
      color: COLORS.green,
    });
    addText(this, this.view, 500, 263, `本週計畫 ${money(record.plannedDeposit)}`, {
      fontSize: 14,
      color: record.deposit >= record.plannedDeposit ? COLORS.green : COLORS.coral,
      bold: true,
    });
    addProgressBar(this, this.view, 68, 302, 824, 17, record.fund, COLLECTION_GOAL);
    addText(this, this.view, 68, 329, `卡片基金 ${money(record.fund)} / ${money(COLLECTION_GOAL)}`, {
      fontSize: 13,
      color: COLORS.muted,
    });

    const weeksRemaining = TOTAL_WEEKS - this.run.weekIndex;
    const needed = getRequiredWeeklySaving(this.run.fund, weeksRemaining);
    const summary = this.run.fund >= COLLECTION_GOAL
      ? '目標已達成！接下來仍可繼續安排消費，園遊會時再兌換整套卡片。'
      : weeksRemaining > 0
        ? `錢包還有 ${money(record.wallet)}。剩 ${weeksRemaining} 週，平均每週約需存 ${money(needed)}。`
        : `六週結束，距離目標還差 ${money(Math.max(0, COLLECTION_GOAL - this.run.fund))}。`;
    addText(this, this.view, 68, 357, summary, { fontSize: 14, bold: true, wrapWidth: 820 });

    addButton(this, this.view, 330, 442, 300, 54,
      weeksRemaining > 0 ? '進入下一週' : '查看園遊會結果',
      () => weeksRemaining > 0 ? this.renderWeekSelection() : this.renderEnding(),
      { fill: COLORS.green, hoverFill: COLORS.greenHover, fontSize: 17, radius: 17 });
  }

  renderEnding() {
    if (!this.run.summaryRecorded) {
      this.run.summaryRecorded = true;
      const success = this.run.fund >= COLLECTION_GOAL;
      queueEvidenceRecord({
        type: 'runSummary',
        eventId: createEvidenceId('summary'),
        runId: this.run.runId,
        gameVersion: '0.3.0',
        startedAt: this.run.startedAt,
        completedAt: new Date().toISOString(),
        outcome: success ? 'success' : 'shortfall',
        goalAmount: COLLECTION_GOAL,
        finalFund: this.run.fund,
        shortfall: Math.max(0, COLLECTION_GOAL - this.run.fund),
        weeksCompleted: this.run.records.length,
      });
    }
    this.beginView();
    this.addHeader('園遊會結算', `最終基金 ${money(this.run.fund)} / ${money(COLLECTION_GOAL)}`);
    const success = this.run.fund >= COLLECTION_GOAL;

    if (success) {
      addPanel(this, this.view, 32, 90, 896, 90, { fill: COLORS.greenPale, stroke: false, radius: 18 });
      addText(this, this.view, 480, 106, '成功收齊動物卡片！', {
        fontSize: 25,
        bold: true,
        align: 'center',
        originX: 0.5,
      });
      addText(this, this.view, 480, 144, `你存到 ${money(this.run.fund)}，完成六週儲蓄目標。`, {
        fontSize: 15,
        color: COLORS.muted,
        align: 'center',
        originX: 0.5,
      });
      COLLECTION_CARDS.forEach((card, index) => {
        const x = 35 + index * 149;
        addPanel(this, this.view, x, 207, 137, 164, { fill: COLORS.surface, radius: 16 });
        addImage(this, this.view, x + 68, 256, `card-${card.id}`, 68, 68);
        addText(this, this.view, x + 68, 308, card.name, {
          fontSize: 14,
          bold: true,
          align: 'center',
          originX: 0.5,
        });
        addText(this, this.view, x + 68, 335, money(card.price), {
          fontSize: 12,
          color: COLORS.muted,
          align: 'center',
          originX: 0.5,
        });
      });
      addButton(this, this.view, 330, 426, 300, 54, '再玩一次', () => this.replay(), {
        fill: COLORS.green,
        hoverFill: COLORS.greenHover,
        fontSize: 17,
      });
      return;
    }

    const shortfall = COLLECTION_GOAL - this.run.fund;
    addPanel(this, this.view, 32, 88, 896, 90, { fill: COLORS.coralPale, stroke: false, radius: 18 });
    addText(this, this.view, 54, 104, `還差 ${money(shortfall)} 就能收齊卡片。`, { fontSize: 21, bold: true });
    addText(this, this.view, 54, 140, '回看每週計畫和花費，調整策略後再挑戰一次。', {
      fontSize: 14,
      color: COLORS.muted,
    });

    this.run.records.forEach((record, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column === 0 ? 32 : 492;
      const y = 194 + row * 75;
      addPanel(this, this.view, x, y, 436, 64, { fill: COLORS.surface, radius: 14 });
      addText(this, this.view, x + 16, y + 10,
        `第 ${record.weekNumber} 週｜存 ${money(record.deposit)}｜基金 ${money(record.fund)}`,
        { fontSize: 13, bold: true });
      addText(this, this.view, x + 16, y + 34,
        `${record.taskName}；${record.purchaseName} ${money(record.purchaseCost)}；錢包 ${money(record.wallet)}`,
        { fontSize: 11, color: COLORS.muted, wrapWidth: 404 });
    });
    addButton(this, this.view, 330, 435, 300, 54, '調整計畫，再挑戰一次', () => this.replay(), {
      fill: COLORS.green,
      hoverFill: COLORS.greenHover,
      fontSize: 16,
    });
  }

  replay() {
    this.pendingWeeklyPlan = getRequiredWeeklySaving(0, TOTAL_WEEKS);
    this.resetRun(this.pendingWeeklyPlan);
    this.renderIntro();
  }
}
