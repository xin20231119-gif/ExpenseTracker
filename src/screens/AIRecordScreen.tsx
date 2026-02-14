import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { addRecord } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { parseWithGLM, getCategoryName } from '../utils/zhipu';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../theme';
import { useToast } from '../components/Toast';

export default function AIRecordScreen() {
  const navigation = useNavigation<any>();
  const { user, phoneAuthenticated, phoneUserId } = useAuth();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<{
    type: 'income' | 'expense';
    amount: number;
    category: string;
    note: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) {
      showToast('请输入记账内容', 'error');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await parseWithGLM(text);

      if (result) {
        setParsed(result);
        showToast('识别成功', 'success');
      } else {
        showToast('无法识别，请输入金额', 'error');
      }
    } catch (error) {
      showToast('AI 识别失败，请重试', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    if (!user && !phoneAuthenticated) {
      showToast('请先登录', 'error');
      return;
    }

    const currentUserId = user?.id || phoneUserId;

    setLoading(true);
    try {
      await addRecord(currentUserId, {
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        note: parsed.note,
        date: new Date().toISOString().split('T')[0],
      });

      showToast('记录已保存', 'success');
      setTimeout(() => {
        setText('');
        setParsed(null);
        navigation.goBack();
      }, 800);
    } catch (error) {
      showToast('保存失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setParsed(null);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const examples = [
    '今天中午和同事去海底捞吃饭，花了280块',
    '月底了，发工资了，税后18000',
    '早上打车去公司，花了35块钱',
    '买的基金今天分红了1500',
    '给车加满油花了400',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />

      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI 记账</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 输入区域 */}
        <View style={styles.inputSection}>
          <View style={styles.inputTitleContainer}>
            <LinearGradient
              colors={['#5856D6', '#7C7AE6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiIconGradient}
            >
              <Text style={styles.aiIcon}>✨</Text>
            </LinearGradient>
            <Text style={styles.sectionTitle}>用自然语言描述你的收支</Text>
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="例如：今天吃饭花了50元"
            placeholderTextColor={COLORS.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={styles.parseButton}
            onPress={handleParse}
            disabled={isAnalyzing}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#5856D6', '#7C7AE6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.parseButtonGradient}
            >
              {isAnalyzing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.parseButtonText}>GLM AI 智能识别</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 识别结果 */}
        {parsed && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>识别结果</Text>
              <View style={styles.successBadge}>
                <Text style={styles.successBadgeText}>✓ 识别成功</Text>
              </View>
            </View>
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>类型</Text>
                <LinearGradient
                  colors={parsed.type === 'income' ? [COLORS.income, COLORS.incomeLight] : ['#FF6B6B', '#FF8A8A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.typeBadge}
                >
                  <Text style={styles.typeBadgeText}>
                    {parsed.type === 'income' ? '收入' : '支出'}
                  </Text>
                </LinearGradient>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>金额</Text>
                <Text style={styles.resultAmount}>¥{parsed.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>分类</Text>
                <Text style={styles.resultValue}>
                  {getCategoryName(parsed.category, parsed.type)}
                </Text>
              </View>
              <View style={[styles.resultRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.resultLabel}>备注</Text>
                <Text style={styles.resultValue}>{parsed.note || '-'}</Text>
              </View>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>重新识别</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentLight]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>
                    {loading ? '保存中...' : '确认保存'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 示例 */}
        {!parsed && (
          <View style={styles.examplesSection}>
            <Text style={styles.examplesTitle}>试试这样说</Text>
            <View style={styles.examplesContainer}>
              {examples.map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.exampleItem}
                  onPress={() => setText(example)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exampleText}>{example}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 底部安全区域 */}
        <View style={styles.bottomSafeArea} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  inputSection: {
    backgroundColor: COLORS.surface,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    ...SHADOWS.medium,
  },
  inputTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  aiIconGradient: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.small,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  aiIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
    color: COLORS.textPrimary,
  },
  parseButton: {
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
  },
  parseButtonGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  parseButtonText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  resultSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: 0,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    ...SHADOWS.medium,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
  },
  successBadge: {
    backgroundColor: COLORS.income + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  successBadgeText: {
    color: COLORS.income,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  resultCard: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  resultLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  resultValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textPrimary,
  },
  resultAmount: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  typeBadgeText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
  confirmButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  examplesSection: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: 0,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.large,
    ...SHADOWS.small,
  },
  examplesTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  examplesContainer: {
    gap: SPACING.sm,
  },
  exampleItem: {
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
  },
  exampleText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.sm,
  },
  bottomSafeArea: {
    height: 40,
  },
});
