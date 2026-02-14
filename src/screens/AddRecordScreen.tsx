import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { addRecord } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { CATEGORIES } from '../types';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, CATEGORY_GRADIENTS } from '../theme';
import { useToast } from '../components/Toast';

export default function AddRecordScreen() {
  const navigation = useNavigation();
  const { user, phoneAuthenticated, phoneUserId } = useAuth();
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const categories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  const handleSave = async () => {
    Keyboard.dismiss();
    if (!amount || parseFloat(amount) <= 0) {
      showToast('请输入有效金额', 'error');
      return;
    }
    if (!category) {
      showToast('请选择分类', 'error');
      return;
    }
    if (!user && !phoneAuthenticated) {
      showToast('请先登录', 'error');
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentUserId = user?.id || phoneUserId;

      await addRecord(currentUserId, {
        type,
        amount: parseFloat(amount),
        category,
        note,
        date: today,
      });

      showToast('记录已保存', 'success');
      setTimeout(() => {
        navigation.goBack();
      }, 800);
    } catch (error) {
      console.error('保存失败:', error);
      showToast('保存失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    Keyboard.dismiss();
    navigation.goBack();
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <StatusBar barStyle="dark-content" />

        {/* 顶部导航栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>添加记录</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* 类型选择 */}
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && styles.typeButtonActiveExpense,
              ]}
              onPress={() => {
                setType('expense');
                setCategory('');
              }}
            >
              {type === 'expense' ? (
                <LinearGradient
                  colors={['#FF6B6B', '#FF8A8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.typeButtonGradient}
                >
                  <Text style={styles.typeButtonTextActive}>支出</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.typeButtonTextInactive}>支出</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && styles.typeButtonActiveIncome,
              ]}
              onPress={() => {
                setType('income');
                setCategory('');
              }}
            >
              {type === 'income' ? (
                <LinearGradient
                  colors={[COLORS.income, COLORS.incomeLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.typeButtonGradient}
                >
                  <Text style={styles.typeButtonTextActive}>收入</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.typeButtonTextInactive}>收入</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 金额输入 */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>¥</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          {/* 分类选择 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>选择分类</Text>
            <View style={styles.categoryGrid}>
              {categories.map(cat => {
                const isActive = category === cat.id;
                const gradient = CATEGORY_GRADIENTS[cat.id] || ['#8E8E93', '#AEAEB2'];
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      isActive && styles.categoryItemActive,
                    ]}
                    onPress={() => {
                      dismissKeyboard();
                      setCategory(cat.id);
                    }}
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
                    <Text
                      style={[
                        styles.categoryName,
                        isActive && styles.categoryNameActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 备注输入 */}
          <View style={styles.section}>
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
          </View>
        </ScrollView>

        {/* 保存按钮 */}
        <View style={styles.footer}>
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
                <Text style={styles.saveButtonText}>保存记录</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
  scrollContent: {
    paddingBottom: 20,
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
