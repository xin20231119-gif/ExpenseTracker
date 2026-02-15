import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { ExpenseRecord } from '../types';

const CACHE_KEY_PREFIX = 'expense_cache_';
const CACHE_EXPIRY = 5 * 60 * 1000; // 缓存5分钟

// 缓存管理
const getCacheKey = (userId: string) => `${CACHE_KEY_PREFIX}${userId}`;

const getCachedRecords = async (userId: string): Promise<ExpenseRecord[] | null> => {
  try {
    const cached = await AsyncStorage.getItem(getCacheKey(userId));
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // 检查缓存是否过期
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
};

const setCachedRecords = async (userId: string, records: ExpenseRecord[]) => {
  try {
    await AsyncStorage.setItem(getCacheKey(userId), JSON.stringify({
      data: records,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.error('Cache write error:', e);
  }
};

const clearCache = async (userId: string) => {
  try {
    await AsyncStorage.removeItem(getCacheKey(userId));
  } catch (e) {
    console.error('Cache clear error:', e);
  }
};

// 获取所有记录
export const getRecords = async (userId: string): Promise<ExpenseRecord[]> => {
  try {
    // 先尝试从缓存获取
    const cached = await getCachedRecords(userId);
    if (cached) {
      // 返回缓存数据，同时在后台刷新
      fetchAndCacheRecords(userId);
      return cached;
    }

    // 缓存不存在，从服务器获取
    return await fetchAndCacheRecords(userId);
  } catch (error) {
    console.error('Error loading records:', error);
    return [];
  }
};

// 后台获取并缓存记录
const fetchAndCacheRecords = async (userId: string): Promise<ExpenseRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading records:', error);
      return [];
    }

    // 转换数据库字段到前端模型
    const records = (data || []).map(row => ({
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      category: row.category,
      note: row.note || '',
      date: row.date,
      createdAt: new Date(row.created_at).getTime(),
    }));

    // 缓存结果
    await setCachedRecords(userId, records);

    return records;
  } catch (error) {
    console.error('Error loading records:', error);
    return [];
  }
};

// 保存记录（批量保存，用于同步）
export const saveRecords = async (userId: string, records: ExpenseRecord[]): Promise<void> => {
  try {
    // 先删除用户所有记录，再重新插入
    await supabase.from('expenses').delete().eq('user_id', userId);

    if (records.length === 0) return;

    const recordsToInsert = records.map(record => ({
      id: record.id,
      user_id: userId,
      type: record.type,
      amount: record.amount,
      category: record.category,
      note: record.note,
      date: record.date,
      created_at: new Date(record.createdAt).toISOString(),
    }));

    const { error } = await supabase.from('expenses').insert(recordsToInsert);

    if (error) {
      console.error('Error saving records:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving records:', error);
    throw error;
  }
};

// 添加新记录
export const addRecord = async (userId: string, record: Omit<ExpenseRecord, 'id' | 'createdAt'>): Promise<ExpenseRecord> => {
  const newRecord: ExpenseRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  const { error } = await supabase.from('expenses').insert({
    id: newRecord.id,
    user_id: userId,
    type: newRecord.type,
    amount: newRecord.amount,
    category: newRecord.category,
    note: newRecord.note,
    date: newRecord.date,
    created_at: new Date(newRecord.createdAt).toISOString(),
  });

  if (error) {
    console.error('Error adding record:', error);
    throw error;
  }

  // 清除缓存
  await clearCache(userId);

  return newRecord;
};

// 删除记录
export const deleteRecord = async (userId: string, id: string): Promise<void> => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) {
    console.error('Error deleting record:', error);
    throw error;
  }

  // 清除缓存
  await clearCache(userId);
};

// 更新记录
export const updateRecord = async (userId: string, id: string, updates: Partial<Omit<ExpenseRecord, 'id' | 'createdAt'>>): Promise<void> => {
  const updateData: Record<string, unknown> = {};

  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.amount !== undefined) updateData.amount = updates.amount;
  if (updates.category !== undefined) updateData.category = updates.category;
  if (updates.note !== undefined) updateData.note = updates.note;
  if (updates.date !== undefined) updateData.date = updates.date;

  const { error } = await supabase
    .from('expenses')
    .update(updateData)
    .eq('user_id', userId)
    .eq('id', id);

  if (error) {
    console.error('Error updating record:', error);
    throw error;
  }

  // 清除缓存
  await clearCache(userId);
};

// 获取本月记录
export const getCurrentMonthRecords = async (userId: string): Promise<ExpenseRecord[]> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startOfMonth)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading current month records:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    note: row.note || '',
    date: row.date,
    createdAt: new Date(row.created_at).getTime(),
  }));
};

// 获取指定月份记录
export const getRecordsByMonth = async (userId: string, year: number, month: number): Promise<ExpenseRecord[]> => {
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading records by month:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    category: row.category,
    note: row.note || '',
    date: row.date,
    createdAt: new Date(row.created_at).getTime(),
  }));
};
