import { ALLOWANCE_PER_WEEK, COLLECTION_GOAL, PLAN_STEP } from '../data/economy.js';

export function getTaskOutcome(task, event) {
  const bonus = event.taskBonuses?.[task.id] ?? 0;
  const reward = task.reward + bonus;
  return {
    reward,
    bonus,
    cost: task.cost,
    net: reward - task.cost,
  };
}

export function getAvailableMoney(wallet, task, event) {
  const { reward, cost } = getTaskOutcome(task, event);
  return Math.max(0, wallet + ALLOWANCE_PER_WEEK + reward - cost - (event.expense ?? 0));
}

export function getDrinkPrice(event) {
  return event.drinkPrice ?? 10;
}

export function getRequiredWeeklySaving(fund, weeksRemaining) {
  const amountNeeded = Math.max(0, COLLECTION_GOAL - fund);
  if (amountNeeded === 0) return 0;
  if (weeksRemaining <= 0) return amountNeeded;
  return Math.ceil(amountNeeded / (weeksRemaining * PLAN_STEP)) * PLAN_STEP;
}

export function getWalletAfterAllocation(available, deposit, purchaseCost) {
  return Math.max(0, available - deposit - purchaseCost);
}

export function getPlanForecast(weeklyPlan, weekCount) {
  return weeklyPlan * weekCount;
}
