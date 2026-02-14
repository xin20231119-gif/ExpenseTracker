import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../utils/supabase';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT } from '../theme';

interface AuthScreenProps {
  onAuthSuccess: () => void;
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

  // Phone login - send verification code
  const handleSendPhoneCode = async () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的手机号');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: '+86' + phone,
      });
      if (error) throw error;
      setVerificationSent(true);
    } catch (err: any) {
      setError(err.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  // Phone login - verify code
  const handlePhoneLogin = async () => {
    if (!phone || !phoneCode) {
      setError('请输入手机号和验证码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: '+86' + phone,
        token: phoneCode,
        type: 'sms',
      });
      if (error) throw error;
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || '验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = loginMethod === 'email' ? handleEmailAuth : handlePhoneLogin;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoText}>💰</Text>
          </LinearGradient>
          <Text style={styles.appName}>记账助手</Text>
        </View>

        {/* 登录方式切换 */}
        <View style={styles.methodToggle}>
          <TouchableOpacity
            style={[styles.methodButton, loginMethod === 'email' && styles.methodButtonActive]}
            onPress={() => {
              setLoginMethod('email');
              setError('');
              setVerificationSent(false);
            }}
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
          >
            <Text style={[styles.methodText, loginMethod === 'phone' && styles.methodTextActive]}>
              手机号登录
            </Text>
          </TouchableOpacity>
        </View>

        {/* 表单 */}
        <View style={styles.form}>
          <Text style={styles.title}>{isLogin ? '登录' : '注册'}</Text>

          {loginMethod === 'email' ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>邮箱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="至少6位"
                  placeholderTextColor={COLORS.textTertiary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </>
          ) : (
            <>
              {!verificationSent ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>手机号</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="请输入手机号"
                    placeholderTextColor={COLORS.textTertiary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={11}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>手机号</Text>
                    <TextInput
                      style={[styles.input, styles.inputDisabled]}
                      value={phone}
                      editable={false}
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>验证码</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="请输入收到的验证码"
                      placeholderTextColor={COLORS.textTertiary}
                      value={phoneCode}
                      onChangeText={setPhoneCode}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </>
              )}
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
            >
              <Text style={styles.switchText}>返回重新输入</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
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
    marginBottom: SPACING.xl,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.large,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.xs,
    marginBottom: SPACING.lg,
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
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.medium,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.textPrimary,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  errorText: {
    color: COLORS.expense,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginBottom: SPACING.md,
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
