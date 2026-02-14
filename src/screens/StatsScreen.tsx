import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-chart-kit';
import { getCurrentMonthRecords } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseRecord, CATEGORIES } from '../types';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, CATEGORY_GRADIENTS } from '../theme';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { user, phoneAuthenticated, phoneUserId } = useAuth();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);

  const currentUserId = user?.id || phoneUserId;

  const loadData = async () => {
    if (currentUserId) {
      const data = await getCurrentMonthRecords(currentUserId);
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

  // 计算支出分类统计
  const expenseByCategory = records
    .filter(r => r.type === 'expense')
    .reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

  // 计算收入分类统计
  const incomeByCategory = records
    .filter(r => r.type === 'income')
    .reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

  // 准备饼图数据
  const expensePieData = Object.entries(expenseByCategory)
    .map(([categoryId, amount]) => {
      const category = CATEGORIES.expense.find(c => c.id === categoryId);
      const gradient = CATEGORY_GRADIENTS[categoryId] || ['#8E8E93', '#AEAEB2'];
      return {
        name: category?.name || categoryId,
        amount,
        color: gradient[0],
        legendFontColor: COLORS.textSecondary,
        legendFontSize: 12,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const incomePieData = Object.entries(incomeByCategory)
    .map(([categoryId, amount]) => {
      const category = CATEGORIES.income.find(c => c.id === categoryId);
      const gradient = CATEGORY_GRADIENTS[categoryId] || ['#8E8E93', '#AEAEB2'];
      return {
        name: category?.name || categoryId,
        amount,
        color: gradient[0],
        legendFontColor: COLORS.textSecondary,
        legendFontSize: 12,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // 统计
  const totalIncome = records
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const currentMonth = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  });

  const formatAmount = (amount: number) => {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万';
    }
    return amount.toFixed(2);
  };

  const chartConfig = {
    color: (opacity = 1) => `rgba(26, 39, 68, ${opacity})`,
    labelColor: () => COLORS.textSecondary,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: COLORS.border,
    },
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 顶部渐变背景 */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>本月统计</Text>
            <Text style={styles.headerSubtitle}>{currentMonth}</Text>
          </View>
        </LinearGradient>

        {/* 收支概览卡片 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryLabelContainer}>
                <View style={[styles.summaryDot, { backgroundColor: COLORS.income }]} />
                <Text style={styles.summaryLabel}>总收入</Text>
              </View>
              <Text style={[styles.summaryAmount, { color: COLORS.income }]}>
                ¥{formatAmount(totalIncome)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <View style={styles.summaryLabelContainer}>
                <View style={[styles.summaryDot, { backgroundColor: COLORS.expense }]} />
                <Text style={styles.summaryLabel}>总支出</Text>
              </View>
              <Text style={[styles.summaryAmount, { color: COLORS.expense }]}>
                ¥{formatAmount(totalExpense)}
              </Text>
            </View>
          </View>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>本月结余</Text>
            <LinearGradient
              colors={totalIncome - totalExpense >= 0 ? [COLORS.income, COLORS.incomeLight] : [COLORS.expense, COLORS.expenseLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.balanceGradient}
            >
              <Text style={styles.balanceAmount}>
                ¥{formatAmount(totalIncome - totalExpense)}
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* 支出饼图 */}
        {expensePieData.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleContainer}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8A8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.chartTitleIcon}
                >
                  <Text style={styles.chartTitleIconText}>💸</Text>
                </LinearGradient>
                <Text style={styles.chartTitle}>支出分布</Text>
              </View>
              <Text style={styles.chartSubtitle}>共 {expensePieData.length} 个分类</Text>
            </View>
            <PieChart
              data={expensePieData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <View style={styles.legendList}>
              {expensePieData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.name}</Text>
                  <Text style={styles.legendAmount}>¥{item.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 收入饼图 */}
        {incomePieData.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleContainer}>
                <LinearGradient
                  colors={[COLORS.income, COLORS.incomeLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.chartTitleIcon}
                >
                  <Text style={styles.chartTitleIconText}>💰</Text>
                </LinearGradient>
                <Text style={styles.chartTitle}>收入分布</Text>
              </View>
              <Text style={styles.chartSubtitle}>共 {incomePieData.length} 个分类</Text>
            </View>
            <PieChart
              data={incomePieData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <View style={styles.legendList}>
              {incomePieData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.name}</Text>
                  <Text style={styles.legendAmount}>¥{item.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {records.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>暂无数据</Text>
            <Text style={styles.emptySubtext}>开始记账后可以看到统计图表</Text>
          </View>
        )}

        {/* 底部安全区域 */}
        <View style={styles.bottomSafeArea} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
    paddingBottom: 50,
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
  summaryCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: -30,
    borderRadius: BORDER_RADIUS.xlarge,
    padding: SPACING.xl,
    ...SHADOWS.large,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: COLORS.divider,
  },
  summaryLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  summaryAmount: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  balanceContainer: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  balanceLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  balanceGradient: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
  },
  balanceAmount: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textInverse,
  },
  chartCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartTitleIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  chartTitleIconText: {
    fontSize: 18,
  },
  chartTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  chartSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
  },
  legendList: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  legendText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  legendAmount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxxl,
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    ...SHADOWS.medium,
  },
  emptyIcon: {
    fontSize: 56,
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
  },
  bottomSafeArea: {
    height: 40,
  },
});
