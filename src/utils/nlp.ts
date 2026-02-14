// 自然语言解析工具
// 智能理解中文记账表达

import { CATEGORIES } from '../types';

export interface ParsedRecord {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
}

// 关键词映射
const EXPENSE_KEYWORDS: { [key: string]: string[] } = {
  food: ['吃饭', '餐饮', '午餐', '晚餐', '早餐', '外卖', '美食', '奶茶', '咖啡', '水果', '零食', '买菜', '超市'],
  transport: ['打车', '出租车', '滴滴', '地铁', '公交', '乘车', '加油', '停车', '打车', '开车', '交通'],
  shopping: ['购物', '买', '淘宝', '京东', '拼多多', '衣服', '鞋子', '包包', '化妆品', '日用品'],
  entertainment: ['电影', 'KTV', '唱歌', '游戏', '娱乐', '旅游', '玩', '聚会', '吃饭', '酒吧'],
  housing: ['房租', '水电', '物业', '住房', '住宿', '房租'],
  medical: ['药', '医院', '看病', '医疗', '体检', '医保'],
  education: ['学习', '培训', '课程', '书', '学费', '教育', '买书'],
  other_expense: ['其他', '开销', '花费', '支出'],
};

const INCOME_KEYWORDS: { [key: string]: string[] } = {
  salary: ['工资', '月薪', '发工资', '薪资', '薪水'],
  bonus: ['奖金', '年终奖', '绩效', '红包'],
  investment: ['投资收益', '理财', '股票', '基金', '利息', '分红'],
  gift: ['礼金', '红包', '压岁钱', '礼物', '随礼'],
  other_income: ['收入', '赚钱', '其他收入'],
};

// 金额提取正则
const AMOUNT_PATTERNS = [
  /(\d+(?:\.\d{1,2})?)\s*元/,
  /(\d+(?:\.\d{1,2})?)\s*块/,
  /花?了?(\d+(?:\.\d{1,2})?)/,
  /收?到?(\d+(?:\.\d{1,2})?)/,
  /(\d+(?:\.\d{1,2})?)/,
];

// 解析自然语言
export const parseNaturalLanguage = (text: string): ParsedRecord | null => {
  const normalizedText = text.toLowerCase().trim();

  // 1. 判断是收入还是支出
  let type: 'income' | 'expense' = 'expense';
  const incomeIndicators = ['收入', '赚钱', '收到', '进账', '发工资', '奖金', '投资收益'];
  const expenseIndicators = ['花', '买', '消费', '支出', '开支', '用了', '花了', '吃饭', '打车'];

  for (const indicator of incomeIndicators) {
    if (normalizedText.includes(indicator)) {
      type = 'income';
      break;
    }
  }

  if (type === 'expense') {
    for (const indicator of expenseIndicators) {
      if (normalizedText.includes(indicator)) {
        type = 'expense';
        break;
      }
    }
  }

  // 2. 提取金额
  let amount = 0;
  for (const pattern of AMOUNT_PATTERNS) {
    const match = normalizedText.match(pattern);
    if (match) {
      amount = parseFloat(match[1]);
      if (amount > 0) break;
    }
  }

  if (amount <= 0) {
    return null; // 无法提取金额
  }

  // 3. 识别分类
  let category = type === 'expense' ? 'other_expense' : 'other_income';
  const keywords = type === 'expense' ? EXPENSE_KEYWORDS : INCOME_KEYWORDS;

  for (const [catId, keywordList] of Object.entries(keywords)) {
    for (const keyword of keywordList) {
      if (normalizedText.includes(keyword)) {
        category = catId;
        break;
      }
    }
    if (category !== (type === 'expense' ? 'other_expense' : 'other_income')) {
      break;
    }
  }

  // 4. 提取备注（去除金额和关键词后的部分）
  let note = text
    .replace(/[\d元块]+/g, '')
    .replace(/[花收日到]+/g, '')
    .trim();
  if (note.length === 0) {
    note = type === 'expense' ? '日常支出' : '其他收入';
  }

  return { type, amount, category, note };
};

// 获取分类名称
export const getCategoryName = (categoryId: string, type: 'income' | 'expense'): string => {
  const categories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
  return categories.find(c => c.id === categoryId)?.name || categoryId;
};
