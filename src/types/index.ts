// 记账记录类型
export interface ExpenseRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string; // ISO date string
  createdAt: number; // timestamp
}

// 分类配置
export const CATEGORIES = {
  income: [
    { id: 'salary', name: '工资', icon: '💰' },
    { id: 'bonus', name: '奖金', icon: '🎁' },
    { id: 'investment', name: '投资收益', icon: '📈' },
    { id: 'gift', name: '礼金', icon: '🧧' },
    { id: 'other_income', name: '其他收入', icon: '💵' },
  ],
  expense: [
    { id: 'food', name: '餐饮', icon: '🍔' },
    { id: 'transport', name: '交通', icon: '🚗' },
    { id: 'shopping', name: '购物', icon: '🛍️' },
    { id: 'entertainment', name: '娱乐', icon: '🎮' },
    { id: 'housing', name: '住房', icon: '🏠' },
    { id: 'medical', name: '医疗', icon: '💊' },
    { id: 'education', name: '教育', icon: '📚' },
    { id: 'other_expense', name: '其他', icon: '📦' },
  ],
};

// 默认分类颜色
export const CATEGORY_COLORS: { [key: string]: string } = {
  salary: '#4CAF50',
  bonus: '#8BC34A',
  investment: '#009688',
  gift: '#FF9800',
  other_income: '#CDDC39',
  food: '#F44336',
  transport: '#2196F3',
  shopping: '#E91E63',
  entertainment: '#9C27B0',
  housing: '#795548',
  medical: '#FF5722',
  education: '#00BCD4',
  other_expense: '#607D8B',
};
