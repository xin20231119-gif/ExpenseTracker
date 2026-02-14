// 现代金融风格主题设计系统
// Modern Finance Theme Design System

export const COLORS = {
  // 主色调 - 深海军蓝
  primary: '#1A2744',
  primaryLight: '#2A3A5C',
  primaryDark: '#0F1A2E',

  // 强调色 - 暖金
  accent: '#D4A853',
  accentLight: '#E8C97A',
  accentDark: '#B8923F',

  // 收入/支出色
  income: '#34C759',
  incomeLight: '#30D158',
  expense: '#FF6B6B',
  expenseLight: '#FF8A8A',

  // 中性色
  background: '#F8F9FB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // 文字色
  textPrimary: '#1A2744',
  textSecondary: '#6B7A94',
  textTertiary: '#9BA8BF',
  textInverse: '#FFFFFF',

  // 边框和分割线
  border: '#E8ECF2',
  divider: '#F0F2F5',

  // 状态色
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',

  // 渐变色
  gradientPrimary: ['#1A2744', '#2A3A5C'],
  gradientAccent: ['#D4A853', '#E8C97A'],
  gradientIncome: ['#34C759', '#30D158'],
  gradientExpense: ['#FF6B6B', '#FF8A8A'],
};

export const SHADOWS = {
  small: {
    shadowColor: '#1A2744',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#1A2744',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#1A2744',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: '#D4A853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const BORDER_RADIUS = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  full: 9999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// 字体大小系统
export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

// 字体粗细
export const FONT_WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// 分类图标映射（替代emoji，使用更精致的图标）
export const CATEGORY_ICONS: { [key: string]: string } = {
  // 收入
  salary: '💰',
  bonus: '🎁',
  investment: '📈',
  gift: '🧧',
  other_income: '💵',
  // 支出
  food: '🍽️',
  transport: '🚗',
  shopping: '🛍️',
  entertainment: '🎭',
  housing: '🏠',
  medical: '💊',
  education: '📖',
  other_expense: '📦',
};

// 分类渐变色映射
export const CATEGORY_GRADIENTS: { [key: string]: string[] } = {
  salary: ['#34C759', '#30D158'],
  bonus: ['#FF9500', '#FFAA33'],
  investment: ['#5856D6', '#7C7AE6'],
  gift: ['#FF2D55', '#FF5C7C'],
  other_income: ['#00C7BE', '#34D3CB'],
  food: ['#FF6B6B', '#FF8A8A'],
  transport: ['#007AFF', '#3395FF'],
  shopping: ['#AF52DE', '#C77DE8'],
  entertainment: ['#FF9500', '#FFAA33'],
  housing: ['#8E8E93', '#AEAEB2'],
  medical: ['#FF3B30', '#FF6159'],
  education: ['#5856D6', '#7C7AE6'],
  other_expense: ['#636366', '#8E8E93'],
};

export default {
  COLORS,
  SHADOWS,
  BORDER_RADIUS,
  SPACING,
  FONT_SIZE,
  FONT_WEIGHT,
  CATEGORY_ICONS,
  CATEGORY_GRADIENTS,
};
