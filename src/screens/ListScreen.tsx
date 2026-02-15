import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Animated,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRecords } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseRecord, CATEGORIES } from '../types';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, CATEGORY_GRADIENTS } from '../theme';

export default function ListScreen() {
  const navigation = useNavigation<any>();
  const { user, phoneAuthenticated, phoneUserId } = useAuth();
  const [records, setRecords] = useState<ExpenseRecord[]>([]);

  // 动画引用
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const currentUserId = user?.id || phoneUserId;

  useEffect(() => {
    // 页面加载动画
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  const renderItem = ({ item, index }: { item: ExpenseRecord; index: number }) => {
    const category = getCategoryInfo(item);
    const gradient = CATEGORY_GRADIENTS[item.category] || ['#8E8E93', '#AEAEB2'];

    // 为每个列表项添加延迟动画
    const itemAnimatedStyle = {
      opacity: fadeAnim,
      transform: [
        { translateY: slideAnim },
        {
          translateX: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.recordItemWrapper, itemAnimatedStyle]}>
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
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* 顶部渐变背景 - 增加装饰光效 */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryLight]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* 装饰性光晕 */}
        <View style={styles.headerGlow} />
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <Text style={styles.headerTitle}>账单列表</Text>
          <View style={styles.recordCountBadge}>
            <Text style={styles.recordCountText}>{records.length} 条记录</Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {records.length === 0 ? (
        <Animated.View style={[styles.emptyState, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={[COLORS.primary + '20', COLORS.primary + '10']}
              style={styles.emptyIconGradient}
            >
              <Text style={styles.emptyIcon}>📋</Text>
            </LinearGradient>
          </View>
          <Text style={styles.emptyText}>暂无记录</Text>
          <Text style={styles.emptySubtext}>开始记账吧，记录你的每一笔收支</Text>
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => navigation.navigate('AddRecord')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentLight]}
              style={styles.addFirstButtonGradient}
            >
              <Text style={styles.addFirstButtonText}>开始记账</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={records}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}

      <View style={styles.hintContainer}>
        <View style={styles.hintBadge}>
          <Text style={styles.hint}>点击记录可编辑或删除</Text>
        </View>
      </View>
    </View>
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
    overflow: 'hidden',
    position: 'relative',
  },
  headerGlow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.accent + '20',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textInverse,
    marginBottom: SPACING.sm,
  },
  recordCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  recordCountText: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FONT_WEIGHT.medium,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  recordItemWrapper: {
    marginBottom: SPACING.sm,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.large,
    ...SHADOWS.small,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
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
  emptyIconContainer: {
    marginBottom: SPACING.lg,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 48,
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
    marginBottom: SPACING.xl,
  },
  addFirstButton: {
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  addFirstButtonGradient: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  addFirstButtonText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  hintContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  hintBadge: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    ...SHADOWS.small,
  },
  hint: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
  },
});
