import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRecords } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseRecord, CATEGORIES } from '../types';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, CATEGORY_GRADIENTS } from '../theme';

export default function ListScreen() {
  const navigation = useNavigation<any>();
  const { user, phoneAuthenticated, phoneUserId } = useAuth();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);

  const currentUserId = user?.id || phoneUserId;

  const loadData = async () => {
    if (currentUserId) {
      const data = await getRecords(currentUserId);
      setRecords(data);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [currentUserId])
  );

  useEffect(() => {
    if (currentUserId) {
      loadData();
    }
  }, [currentUserId]);

  const handlePress = (record: ExpenseRecord) => {
    navigation.navigate('EditRecord', { record });
  };

  const getCategoryInfo = (record: ExpenseRecord) => {
    const categories = record.type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
    return categories.find(c => c.id === record.category) || { name: record.category, icon: '📝' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  };

  const renderItem = ({ item }: { item: ExpenseRecord }) => {
    const category = getCategoryInfo(item);
    const gradient = CATEGORY_GRADIENTS[item.category] || ['#8E8E93', '#AEAEB2'];

    return (
      <TouchableOpacity
        style={styles.recordItem}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.categoryIcon}
        >
          <Text style={styles.iconText}>{category.icon}</Text>
        </LinearGradient>
        <View style={styles.recordInfo}>
          <Text style={styles.recordCategory}>{category.name}</Text>
          {item.note ? (
            <Text style={styles.recordNote} numberOfLines={1}>
              {item.note}
            </Text>
          ) : null}
          <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
        </View>
        <Text
          style={[
            styles.recordAmount,
            { color: item.type === 'income' ? COLORS.income : COLORS.expense },
          ]}
        >
          {item.type === 'income' ? '+' : '-'}¥{item.amount.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* 顶部渐变背景 */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>账单列表</Text>
          <Text style={styles.headerSubtitle}>共 {records.length} 条记录</Text>
        </View>
      </LinearGradient>

      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>暂无记录</Text>
          <Text style={styles.emptySubtext}>开始记账吧，记录你的每一笔收支</Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.hintContainer}>
        <Text style={styles.hint}>点击记录可编辑或删除</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 40,
    paddingHorizontal: SPACING.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
  },
  listContent: {
    padding: SPACING.lg,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  recordInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  recordCategory: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  recordNote: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recordDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  recordAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  hintContainer: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  hint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
  },
});
