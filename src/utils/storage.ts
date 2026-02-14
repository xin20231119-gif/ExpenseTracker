import AsyncStorage from '@react-native-async-storage/async-storage';
import { ExpenseRecord } from '../types';

const STORAGE_KEY_PREFIX = '@expense_tracker_records_';

// 生成用户专属的存储key
const getUserStorageKey = (userId: string): string => {
  return `${STORAGE_KEY_PREFIX}${userId}`;
};

// 获取所有记录（需要传入用户ID）
export const getRecords = async (userId: string): Promise<ExpenseRecord[]> => {
  try {
    const STORAGE_KEY = getUserStorageKey(userId);
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading records:', error);
    return [];
  }
};

// 保存记录（需要传入用户ID）
export const saveRecords = async (userId: string, records: ExpenseRecord[]): Promise<void> => {
  try {
    const STORAGE_KEY = getUserStorageKey(userId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Error saving records:', error);
    throw error;
  }
};

// 添加新记录
export const addRecord = async (userId: string, record: Omit<ExpenseRecord, 'id' | 'createdAt'>): Promise<ExpenseRecord> => {
  const records = await getRecords(userId);
  const newRecord: ExpenseRecord = {
    ...record,
    id: Date.now().toString(),
    createdAt: Date.now(),
  };
  records.unshift(newRecord);
  await saveRecords(userId, records);
  return newRecord;
};

// 删除记录
export const deleteRecord = async (userId: string, id: string): Promise<void> => {
  const records = await getRecords(userId);
  const filtered = records.filter(r => r.id !== id);
  await saveRecords(userId, filtered);
};

// 更新记录
export const updateRecord = async (userId: string, id: string, updates: Partial<Omit<ExpenseRecord, 'id' | 'createdAt'>>): Promise<void> => {
  const records = await getRecords(userId);
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index] = { ...records[index], ...updates };
    await saveRecords(userId, records);
  }
};

// 获取本月记录
export const getCurrentMonthRecords = async (userId: string): Promise<ExpenseRecord[]> => {
  const records = await getRecords(userId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return records.filter(r => new Date(r.date) >= startOfMonth);
};

// 获取指定月份记录
export const getRecordsByMonth = async (userId: string, year: number, month: number): Promise<ExpenseRecord[]> => {
  const records = await getRecords(userId);
  return records.filter(r => {
    const date = new Date(r.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
};
