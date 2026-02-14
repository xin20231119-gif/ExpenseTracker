import { createClient } from '@supabase/supabase-js';

// 你的 Supabase 项目信息
const supabaseUrl = 'https://vbldhkgmyjauxsnhbajq.supabase.co';
const supabaseAnonKey = 'sb_publishable_C1x8Z79yGSkHxKSbiao32A_Kc3XD8HI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 存储当前登录用户
export const getCurrentUser = () => supabase.auth.getUser();

export const signOut = () => supabase.auth.signOut();
