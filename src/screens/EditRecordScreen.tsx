import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { addRecord, updateRecord, deleteRecord } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORIES, ExpenseRecord } from '../types';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, CATEGORY_GRADIENTS } from '../theme';
import { useToast } from '../components/Toast';

type RootStackParamList = {
  EditRecord: { record: ExpenseRecord };
};

export default function EditRecordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditRecord'>>();
  const { user, phoneAuthenticated, phoneUserId } = useAuth();
  const record = route.params?.record;
  const { showToast, showConfirm } = useToast();

  const [type, setType] = useState<'expense' | 'income'>(record?.type || 'expense');
  const [amount, setAmount] = useState(record?.amount?.toString() || '');
  const [category, setCategory] = useState(record?.category || '');
  const [note, setNote] = useState(record?.note || '');
  const [saving, setSaving] = useState(false);

  // 动画引用
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const typeButtonScale = useRef(new Animated.Value(1)).current;
  const categoryScale = useRef(new Map()).current;

  useEffect(() => {
    // 页面加载动画
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isEditing = !!record;
  const categories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;
  const currentUserId = user?.id || phoneUserId;

  const handleSave = async () => {
    if (!user && !phoneAuthenticated) {
      showToast('请先登录', 'error');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      showToast('请输入有效金额', 'error');
      return;
    }
    if (!category) {
      showToast('请选择分类', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await updateRecord(currentUserId, record.id, {
          type,
          amount: parseFloat(amount),
          category,
          note,
        });
        showToast('记录已更新', 'success');
      } else {
        const today = new Date().toISOString().split('T')[0];
        await addRecord(currentUserId, {
          type,
          amount: parseFloat(amount),
          category,
          note,
          date: today,
        });
        showToast('记录已保存', 'success');
      }
      setTimeout(() => {
        navigation.goBack();
      }, 800);
    } catch (error) {
      console.error('操作失败:', error);
      showToast('操作失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!record || (!user && !phoneAuthenticated)) return;

    // 使用 Toast 的 showConfirm 确认弹窗
    showConfirm('确认删除', '确定要删除这条记录吗？', async () => {
      try {
        await deleteRecord(currentUserId, record.id);
        showToast('记录已删除', 'success');
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } catch (error) {
        console.error('删除失败:', error);
        showToast('删除失败，请重试', 'error');
      }
    });
  };

  const handleClose = () => {
    navigation.goBack();
  };

  // 类型切换动画
  const handleTypeChange = (newType: 'expense' | 'income') => {
    Animated.sequence([
      Animated.spring(typeButtonScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
      Animated.spring(typeButtonScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
    setType(newType);
    setCategory('');
  };

  // 分类选择动画
  const handleCategoryPress = (catId: string) => {
    const scaleAnim = categoryScale.get(catId) || new Animated.Value(1);

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    categoryScale.set(catId, scaleAnim);
    setCategory(catId);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" />

      {/* 顶部导航栏 */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? '编辑记录' : '添加记录'}</Text>
        <View style={styles.placeholder} />
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 类型选择 */}
        <Animated.View
          style={[
            styles.typeContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.typeButton, type === 'expense' && styles.typeButtonActiveExpense]}
            onPress={() => handleTypeChange('expense')}
            activeOpacity={0.8}
          >
            {type === 'expense' ? (
              <Animated.View style={{ transform: [{ scale: typeButtonScale }] }}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF8A8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.typeButtonGradient}
                >
                  <Text style={styles.typeButtonTextActive}>支出</Text>
                </LinearGradient>
              </Animated.View>
            ) : (
              <Text style={styles.typeButtonTextInactive}>支出</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, type === 'income' && styles.typeButtonActiveIncome]}
            onPress={() => handleTypeChange('income')}
            activeOpacity={0.8}
          >
            {type === 'income' ? (
              <Animated.View style={{ transform: [{ scale: typeButtonScale }] }}>
                <LinearGradient
                  colors={[COLORS.income, COLORS.incomeLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.typeButtonGradient}
                >
                  <Text style={styles.typeButtonTextActive}>收入</Text>
                </LinearGradient>
              </Animated.View>
            ) : (
              <Text style={styles.typeButtonTextInactive}>收入</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* ���额输入 */}
        <Animated.View
          style={[
            styles.amountContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.currencySymbol}>¥</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </Animated.View>

        {/* 分类选择 */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>选择分类</Text>
          <View style={styles.categoryGrid}>
            {categories.map(cat => {
              const isActive = category === cat.id;
              const gradient = CATEGORY_GRADIENTS[cat.id] || ['#8E8E93', '#AEAEB2'];
              const scaleAnim = categoryScale.get(cat.id) || new Animated.Value(1);

              return (
                <Animated.View key={cat.id} style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity
                    style={[styles.categoryItem, isActive && styles.categoryItemActive]}
                    onPress={() => handleCategoryPress(cat.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={isActive ? gradient : [COLORS.background, COLORS.background]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.categoryIconContainer,
                        !isActive && styles.categoryIconContainerInactive,
                      ]}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    </LinearGradient>
                    <Text style={[styles.categoryName, isActive && styles.categoryNameActive]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* 备注输入 */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>备注（可选）</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="添加备注..."
            placeholderTextColor={COLORS.textTertiary}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
          />
        </Animated.View>

        {/* 删除按钮（仅编辑时显示） */}
        {isEditing && (
          <Animated.View
            style={[
              styles.deleteButtonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.7}>
              <Text style={styles.deleteButtonText}>删除记录</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* 保存按钮 */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
          disabled={saving}
        >
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.textInverse} />
            ) : (
              <Text style={styles.saveButtonText}>{isEditing ? '更新记录' : '保存记录'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  placeholder: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  typeContainer: {
    flexDirection: 'row',
    margin: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.large,
    padding: SPACING.xs,
    ...SHADOWS.small,
  },
  typeButton: {
    flex: 1,
  },
  typeButtonGradient: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
  },
  typeButtonTextActive: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textInverse,
  },
  typeButtonTextInactive: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: SPACING.md,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxxl,
    borderRadius: BORDER_RADIUS.large,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
  },
  currencySymbol: {
    fontSize: FONT_SIZE.xxxl,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  amountInput: {
    fontSize: 56,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    minWidth: 180,
    textAlign: 'center',
  },
  section: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryItem: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  categoryItemActive: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  categoryIconContainerInactive: {
    backgroundColor: COLORS.background,
  },
  categoryIcon: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  categoryNameActive: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  noteInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    minHeight: 100,
    textAlignVertical: 'top',
    color: COLORS.textPrimary,
  },
  deleteButtonContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  deleteButton: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.expense,
  },
  deleteButtonText: {
    color: COLORS.expense,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  saveButton: {
    borderRadius: BORDER_RADIUS.large,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  saveButtonGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
