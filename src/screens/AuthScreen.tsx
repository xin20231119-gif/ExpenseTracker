import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../utils/supabase';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../theme';

const SUPABASE_URL = 'https://vbldhkgmyjauxsnhbajq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_C1x8Z79yGSkHxKSbiao32A_Kc3XD8HI';
const PHONE_AUTH_FUNCTION = `${SUPABASE_URL}/functions/v1/phone-auth`;

interface AuthScreenProps {
  onAuthSuccess: (userId?: string) => void;
}

type LoginMethod = 'email' | 'phone';

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [isLogin, setIsLogin] = useState(true);

  // Email fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone fields
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 动画引用
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const inputFocusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 页面加载动画
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
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
      ]),
    ]).start();
  }, []);

  // Email login/register
  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Phone login - send verification code (使用自定义 Edge Function)
  const handleSendPhoneCode = async () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(PHONE_AUTH_FUNCTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          phone: phone,
          action: 'send',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || '发送验证码失败');
      }

      setVerificationSent(true);
    } catch (err: any) {
      setError(err.message || '发送验证码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Phone login - verify code (使用自定义 Edge Function)
  const handlePhoneLogin = async () => {
    if (!phone || !phoneCode) {
      setError('请输入手机号和验证码');
      return;
    }

    if (phoneCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(PHONE_AUTH_FUNCTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          phone: phone,
          code: phoneCode,
          action: 'verify',
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || '验证码错误或已过期');
      }

      // 验证码正确，登录成功
      onAuthSuccess(data.userId);
    } catch (err: any) {
      setError(err.message || '验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = loginMethod === 'email' ? handleEmailAuth : handlePhoneLogin;

  // 输入框聚焦动画
  const handleInputFocus = () => {
    Animated.timing(inputFocusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleInputBlur = () => {
    Animated.timing(inputFocusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Logo - 带动画 */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: logoScale },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoText}>💰</Text>
          </LinearGradient>
          <Text style={styles.appName}>记账助手</Text>
          <Text style={styles.appSlogan}>让每一笔支出都有迹可循</Text>
        </Animated.View>

        {/* 登录方式切换 */}
        <Animated.View
          style={[
            styles.methodToggleContainer,
            { opacity: fadeAnim },
          ]}
        >
          <View style={styles.methodToggle}>
            <TouchableOpacity
              style={[styles.methodButton, loginMethod === 'email' && styles.methodButtonActive]}
              onPress={() => {
                setLoginMethod('email');
                setError('');
                setVerificationSent(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.methodText, loginMethod === 'email' && styles.methodTextActive]}>
                邮箱登录
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.methodButton, loginMethod === 'phone' && styles.methodButtonActive]}
              onPress={() => {
                setLoginMethod('phone');
                setError('');
                setVerificationSent(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.methodText, loginMethod === 'phone' && styles.methodTextActive]}>
                手机号登录
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* 表单 */}
        <Animated.View
          style={[
            styles.form,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>{isLogin ? '欢迎回来' : '创建账号'}</Text>

          {loginMethod === 'email' ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>邮箱</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor={COLORS.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>密码</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="至少6位"
                    placeholderTextColor={COLORS.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              {!verificationSent ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>手机号</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="请输入手机号"
                      placeholderTextColor={COLORS.textTertiary}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={11}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>手机号</Text>
                    <View style={[styles.inputWrapper, styles.inputDisabled]}>
                      <TextInput
                        style={[styles.input, styles.inputTextDisabled]}
                        value={phone}
                        editable={false}
                      />
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>验证码</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="请输入收到的验证码"
                        placeholderTextColor={COLORS.textTertiary}
                        value={phoneCode}
                        onChangeText={setPhoneCode}
                        keyboardType="number-pad"
                        maxLength={6}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    </View>
                  </View>
                </>
              )}
            </>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={loginMethod === 'email' ? handleEmailAuth : (verificationSent ? handlePhoneLogin : handleSendPhoneCode)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textInverse} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {loginMethod === 'phone' && !verificationSent
                    ? '发送验证码'
                    : isLogin
                    ? '登录'
                    : '注册'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {loginMethod === 'email' && (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                {isLogin ? '没有账号？点击注册' : '已有账号？点击登录'}
              </Text>
            </TouchableOpacity>
          )}

          {loginMethod === 'phone' && verificationSent && (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setVerificationSent(false);
                setPhoneCode('');
                setError('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>返回重新输入</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.large,
  },
  logoText: {
    fontSize: 44,
  },
  appName: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  appSlogan: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
  },
  methodToggleContainer: {
    marginBottom: SPACING.lg,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.xs,
    ...SHADOWS.small,
  },
  methodButton: {
    flex: 1,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.small,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: COLORS.accent,
  },
  methodText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  methodTextActive: {
    color: COLORS.textInverse,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xlarge,
    padding: SPACING.xl,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    backgroundColor: 'transparent',
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  inputTextDisabled: {
    color: COLORS.textSecondary,
  },
  errorContainer: {
    backgroundColor: COLORS.expense + '15',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.expense,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  submitButtonGradient: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  submitButtonText: {
    color: COLORS.textInverse,
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.semibold,
  },
  switchButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.accent,
    fontSize: FONT_SIZE.sm,
  },
});
