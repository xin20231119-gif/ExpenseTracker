import Constants from 'expo-constants';
import { CATEGORIES } from '../types';

// 使用 fetch 直接调用智谱 API（不依赖 zhipuai SDK）
const API_KEY = Constants.expoConfig?.extra?.zhipuApiKey || '';

// 从 CATEGORIES 提取分类 ID 列表
const EXPENSE_CATEGORIES = CATEGORIES.expense.map(c => c.id);
const INCOME_CATEGORIES = CATEGORIES.income.map(c => c.id);

// 系统提示词
const SYSTEM_PROMPT = `你是一个智能记账助手。你的任务是将用户描述的收支信息解析成结构化的记账记录。

请根据用户的描述，提取以下信息：
1. type: "income" (收入) 或 "expense" (支出)
2. amount: 金额（数字）
3. category: 分类 ID，必须是以下之一：
   - 支出: ${EXPENSE_CATEGORIES.join(', ')}
   - 收入: ${INCOME_CATEGORIES.join(', ')}
4. note: 备注信息

请直接返回 JSON 格式，不要有其他内容。格式如下：
{"type": "expense", "amount": 50, "category": "food", "note": "今天吃饭"}

注意：
- 如果用户没有明确说明是收入还是支出，根据上下文判断
- 金额必须是数字
- category 必须是上述列表中的有效值
- 如果无法识别，返回 null`;

export interface ParsedResult {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
}

// 简单的正则表达式解析（备选方案）
function simpleParse(text: string): ParsedResult | null {
  // 提取金额
  const amountMatch = text.match(/(\d+(\.\d+)?)/);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1]);

  // 判断是收入还是支出
  const isIncome = /工资|收入|分红|奖金|退款/i.test(text);
  const type: 'income' | 'expense' = isIncome ? 'income' : 'expense';

  // 判断分类
  let category = type === 'expense' ? 'other_expense' : 'other_income';

  if (type === 'expense') {
    if (/吃|饭|餐饮|外卖|餐厅|海底捞/i.test(text)) category = 'food';
    else if (/车|打车|出租|公交|地铁|交通/i.test(text)) category = 'transport';
    else if (/购物|买|商店|超市/i.test(text)) category = 'shopping';
    else if (/娱乐|电影|游戏|演出/i.test(text)) category = 'entertainment';
    else if (/住|房租|水电|物业/i.test(text)) category = 'housing';
    else if (/药|医院|医疗|看病/i.test(text)) category = 'medical';
    else if (/学费|培训|教育|书/i.test(text)) category = 'education';
  } else {
    if (/工资|月薪/i.test(text)) category = 'salary';
    else if (/奖金|年终奖|分红/i.test(text)) category = 'bonus';
    else if (/投资|理财|基金|股票/i.test(text)) category = 'investment';
    else if (/礼物|红包|份子/i.test(text)) category = 'gift';
  }

  // 提取备注（去掉金额和关键词）
  let note = text.replace(/\d+(\.\d+)?/g, '').replace(/[元块]/g, '').trim();
  if (!note) note = text;

  return { type, amount, category, note };
}

// 从 Markdown 代码块中提取 JSON
function extractJsonFromContent(content: string): string {
  // 去掉 ```json 和 ``` 标记
  let jsonStr = content.trim();
  jsonStr = jsonStr.replace(/^```json\s*/i, '');
  jsonStr = jsonStr.replace(/```$/, '');
  jsonStr = jsonStr.trim();
  return jsonStr;
}

// 使用智谱 GLM 模型解析自然语言
export const parseWithGLM = async (text: string): Promise<ParsedResult | null> => {
  if (!API_KEY) {
    console.warn('智谱 API 未配置，使用简单解析');
    return simpleParse(text);
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY,
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('智谱 API 错误:', response.status, responseText);
      return simpleParse(text);
    }

    // 尝试解析 JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('智谱返回的不是JSON:', responseText);
      return simpleParse(text);
    }

    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      return simpleParse(text);
    }

    console.log('智谱原始返回:', content);

    // 提取 JSON（去掉 Markdown 代码块标记）
    content = extractJsonFromContent(content);
    console.log('提取后的JSON:', content);

    // 解析 JSON 响应
    const result = JSON.parse(content) as ParsedResult;

    // 验证结果
    if (!result.type || !result.amount || !result.category) {
      return simpleParse(text);
    }

    if (result.type !== 'income' && result.type !== 'expense') {
      return simpleParse(text);
    }

    const validCategories = result.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!validCategories.includes(result.category)) {
      result.category = result.type === 'expense' ? 'other_expense' : 'other_income';
    }

    return result;
  } catch (error) {
    console.error('智谱 API 调用失败:', error);
    return simpleParse(text);
  }
};

// 获取分类名称（使用统一的 CATEGORIES）
export const getCategoryName = (categoryId: string, type: 'income' | 'expense'): string => {
  const categories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
  return categories.find(c => c.id === categoryId)?.name || categoryId;
};
