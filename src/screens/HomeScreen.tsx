import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentMonthRecords } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseRecord, CATEGORIES } from '../types';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, CATEGORY_GRADIENTS } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut, phoneAuthenticated, phoneUserId } = useAuth();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // 动画引用
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const currentUserId = user?.id || phoneUserId;
  const isLoggedIn = user || phoneAuthenticated;

  useEffect(() => {
    // 页面加载动画
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

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
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 计算本月收支
  const income = records
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);
  const expense = records
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);
  const balance = income - expense;

  // 获取最近5条记录
  const recentRecords = records.slice(0, 5);

  // 找到分类信息
  const getCategoryInfo = (record: ExpenseRecord) => {
    const categories = record.type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
    return categories.find(c => c.id === record.category) || { name: record.category, icon: '📝' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatAmount = (amount: number) => {
    if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + '万';
    }
    return amount.toFixed(2);
  };

  // 按钮缩放动画
  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* 顶部渐变背景 - 增加装饰性光效 */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* 装饰性光晕 */}
          <View style={styles.headerGlow} />
          <View style={styles.headerGlow2} />

          <Animated.View
            style={[
              styles.headerContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.headerTop}>
              <Text style={styles.headerTitle}>本月收支</Text>
              <TouchableOpacity
                onPress={handleSignOut}
                style={styles.logoutButton}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutText}>登出</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSubtitle}>
              {new Date().getFullYear()}年 {new Date().getMonth() + 1}月
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* 收支概览卡片 - 增加悬浮效果 */}
        <Animated.View
          style={[
            styles.overviewCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={styles.balanceLabelContainer}>
                <View style={[styles.balanceDot, { backgroundColor: COLORS.income }]} />
                <Text style={styles.balanceLabel}>收入</Text>
              </View>
              <Text style={[styles.balanceAmount, { color: COLORS.income }]}>
                ¥{formatAmount(income)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <View style={styles.balanceLabelContainer}>
                <View style={[styles.balanceDot, { backgroundColor: COLORS.expense }]} />
                <Text style={styles.balanceLabel}>支出</Text>
              </View>
              <Text style={[styles.balanceAmount, { color: COLORS.expense }]}>
                ¥{formatAmount(expense)}
              </Text>
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>结余</Text>
            <LinearGradient
              colors={balance >= 0 ? [COLORS.income, COLORS.incomeLight] : [COLORS.expense, COLORS.expenseLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.totalAmountGradient}
            >
              <Text style={styles.totalAmount}>
                ¥{formatAmount(balance)}
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* 快捷记账按钮 - 增加按压动画 */}
        <Animated.View
          style={[
            styles.buttonRow,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate('AIRecord')}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            activeOpacity={1}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
              <LinearGradient
                colors={['#5856D6', '#7C7AE6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiButtonGradient}
              >
                <Text style={styles.aiButtonIcon}>✨</Text>
                <Text style={styles.aiButtonText}>AI 记账</Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => navigation.navigate('AddRecord')}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            activeOpacity={1}
          >
            <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.manualButtonGradient}
              >
                <Text style={styles.manualButtonIcon}>+</Text>
                <Text style={styles.manualButtonText}>手动记账</Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* 最近记录 */}
        <Animated.View
          style={[
            styles.recentSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近记录</Text>
            <TouchableOpacity onPress={() => navigation.navigate('List')} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          {recentRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <LinearGradient
                  colors={[COLORS.primary + '20', COLORS.primary + '10']}
                  style={styles.emptyIconGradient}
                >
                  <Text style={styles.emptyIcon}>📝</Text>
                </LinearGradient>
              </View>
              <Text style={styles.emptyText}>暂无记录，开始记账吧！</Text>
              <Text style={styles.emptySubtext}>点击上方按钮记录您的第一笔收支</Text>
            </View>
          ) : (
            <View style={styles.recordsList}>
              {recentRecords.map((record, index) => {
                const category = getCategoryInfo(record);
                const categoryGradient = CATEGORY_GRADIENTS[record.category] || ['#8E8E93', '#AEAEB2'];
                return (
                  <Animated.View
                    key={record.id}
                    style={[
                      styles.recordItem,
                      {
                        opacity: fadeAnim,
                        transform: [{ translateX: slideAnim }],
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.recordItemInner}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('EditRecord', { record })}
                    >
                      <View style={styles.recordLeft}>
                        <LinearGradient
                          colors={categoryGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.categoryIconContainer}
                        >
                          <Text style={styles.recordIcon}>{category.icon}</Text>
                        </LinearGradient>
                        <View style={styles.recordInfo}>
                          <Text style={styles.recordCategory}>{category.name}</Text>
                          {record.note ? (
                            <Text style={styles.recordNote} numberOfLines={1}>
                              {record.note}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <View style={styles.recordRight}>
                        <Text
                          style={[
                            styles.recordAmount,
                            { color: record.type === 'income' ? COLORS.income : COLORS.expense },
                          ]}
                        >
                          {record.type === 'income' ? '+' : '-'}¥{record.amount.toFixed(2)}
                        </Text>
                        <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>

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
    paddingTop: 20,
    paddingBottom: 50,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  headerGlow: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.accent + '15',
  },
  headerGlow2: {
    position: 'absolute',
    bottom: 20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.income + '10',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textInverse,
    marginBottom: SPACING.xs,
  },
  logoutButton: {
    position: 'absolute',
    right: -SPACING.xl,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  logoutText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  overviewCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: -30,
    borderRadius: BORDER_RADIUS.xlarge,
    padding: SPACING.xl,
    ...SHADOWS.large,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  balanceItem: {
    alignItems: 'center',
    flex: 1,
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.divider,
  },
  balanceLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  balanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  balanceLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  balanceAmount: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  totalRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.lg,
  },
  totalLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  totalAmountGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  totalAmount: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textInverse,
  },
  buttonRow: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  aiButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  aiButtonIcon: {
    fontSize: FONT_SIZE.lg,
  },
  aiButtonText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  manualButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  manualButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  manualButtonIcon: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.textInverse,
    fontWeight: FONT_WEIGHT.bold,
  },
  manualButtonText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  recentSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  seeAllText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.accent,
    fontWeight: FONT_WEIGHT.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyIconContainer: {
    marginBottom: SPACING.md,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
  recordsList: {
    gap: SPACING.sm,
  },
  recordItem: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
  },
  recordItemInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  recordIcon: {
    fontSize: 22,
  },
  recordInfo: {
    flex: 1,
  },
  recordCategory: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  recordNote: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  recordRight: {
    alignItems: 'flex-end',
  },
  recordAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  recordDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  bottomSafeArea: {
    height: 40,
  },
});
