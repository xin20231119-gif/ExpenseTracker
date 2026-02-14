// 阿里云短信发送 Edge Function（自定义验证流程）
// 发送验证码到手机，并存储到数据库

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const ACCESS_KEY_ID = Deno.env.get('ALIYUN_ACCESS_KEY_ID')
const ACCESS_KEY_SECRET = Deno.env.get('ALIYUN_ACCESS_KEY_SECRET')
const SMS_SIGN_NAME = Deno.env.get('ALIYUN_SMS_SIGN_NAME')
const SMS_TEMPLATE_CODE = Deno.env.get('ALIYUN_SMS_TEMPLATE_CODE')

// 检查必要的环境变量
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const ENDPOINT = 'https://dypnsapi.aliyuncs.com/';

function getISOTime() {
  return new Date().toISOString().replace(/\.(\d{3})Z$/, 'Z');
}

function randomString(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function signAliyun(params: Record<string, string>, accessKeySecret: string) {
  const sorted = Object.keys(params).sort().map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&');
  const stringToSign = `POST&%2F&${encodeURIComponent(sorted)}`;
  const key = accessKeySecret + '&';
  const encoder = new TextEncoder();
  const keyBuf = encoder.encode(key);
  const dataBuf = encoder.encode(stringToSign);
  const cryptoKey = await crypto.subtle.importKey('raw', keyBuf, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuf);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// 生成6位数字验证码
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendAliyunSms(phone: string) {
  const params: Record<string, string> = {
    AccessKeyId: ACCESS_KEY_ID,
    Action: 'SendSmsVerifyCode',
    Format: 'JSON',
    PhoneNumber: phone,
    RegionId: 'cn-hangzhou',
    SignName: '速通互联验证码',
    TemplateCode: '100001',
    TemplateParam: JSON.stringify({ code: '##code##', min: '5' }),
    ReturnVerifyCode: 'true',
    CodeLength: '6',
    Timestamp: getISOTime(),
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: randomString(24),
    Version: '2017-05-25',
  };
  const signature = await signAliyun(params, ACCESS_KEY_SECRET);
  params.Signature = signature;
  const body = new URLSearchParams(params).toString();
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await resp.json();
  console.log('Aliyun response:', JSON.stringify(data));
  if (data.Code !== 'OK') throw new Error(data.Message || 'Aliyun SMS send failed');
  // 返回系统生成的验证码
  const verifyCode = data.Model?.VerifyCode;
  console.log('VerifyCode from Aliyun:', verifyCode);
  return verifyCode;
}

Deno.serve(async (req: Request) => {
  const response_headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response_headers })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: response_headers })
    }

    const { phone, action, code } = await req.json()

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Missing phone number' }), { status: 400, headers: response_headers })
    }

    // 格式化手机号（去掉 +86）
    const formattedPhone = phone.replace(/^\+86/, '')

    const supabase = createClient(supabaseUrl, supabaseKey)

    if (action === 'verify') {
      // 验证验证码

      if (!code) {
        return new Response(JSON.stringify({ error: 'Missing verification code' }), { status: 400, headers: response_headers })
      }

      // 查询验证码
      const { data: verification, error: queryError } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('phone', formattedPhone)
        .eq('code', code)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .single()

      if (queryError || !verification) {
        return new Response(JSON.stringify({ error: 'Invalid or expired verification code' }), { status: 400, headers: response_headers })
      }

      // 标记验证码已使用
      await supabase
        .from('phone_verifications')
        .update({ used: true })
        .eq('id', verification.id)

      // 检查用户是否已存在
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', formattedPhone)
        .single()

      if (existingUser) {
        // 用户已存在，返回成功
        return new Response(JSON.stringify({ success: true, exists: true, message: 'Verification successful', userId: existingUser.id }), { status: 200, headers: response_headers })
      } else {
        // 用户不存在，创建新用户
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            phone: formattedPhone,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (createError) {
          console.error('Failed to create user:', createError)
          return new Response(JSON.stringify({ success: true, exists: false, message: 'Verification successful but user creation pending' }), { status: 200, headers: response_headers })
        }

        return new Response(JSON.stringify({ success: true, exists: false, message: 'Verification successful, user created', userId: newUser.id }), { status: 200, headers: response_headers })
      }
    } else {
      // 发送验证码 - 由阿里云系统生成

      // 删除该手机号之前的未使用验证码
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('phone', formattedPhone)
        .eq('used', false)

      // 发送短信，获取系统生成的验证码
      let systemCode: string;
      try {
        systemCode = await sendAliyunSms(formattedPhone)
        console.log('Generated code from Aliyun:', systemCode)
      } catch (smsError: any) {
        console.error('Failed to send SMS:', smsError)
        return new Response(JSON.stringify({ error: 'Failed to send SMS: ' + smsError.message }), { status: 500, headers: response_headers })
      }

      if (!systemCode) {
        console.error('No verification code returned from Aliyun')
        return new Response(JSON.stringify({ error: 'Failed to generate verification code' }), { status: 500, headers: response_headers })
      }

      // 存储验证码
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5分钟有效期
      console.log('Storing verification:', { phone: formattedPhone, code: systemCode, expiresAt })

      const { error: insertError } = await supabase
        .from('phone_verifications')
        .insert({
          phone: formattedPhone,
          code: systemCode,
          expires_at: expiresAt,
          used: false,
        })

      if (insertError) {
        console.error('Failed to store verification:', insertError)
        return new Response(JSON.stringify({ error: 'Failed to store verification' }), { status: 500, headers: response_headers })
      }

      return new Response(JSON.stringify({ success: true, message: 'Verification code sent' }), { status: 200, headers: response_headers })
    }
  } catch (e: any) {
    console.error('[Error]:', e)
    return new Response(JSON.stringify({ error: e.message || 'Internal error' }), { status: 500, headers: response_headers })
  }
})
