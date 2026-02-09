import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 1. 브라우저용 클라이언트 (기존과 동일)
export const supabaseBrowser = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)

/**
 * 2. 서버/관리자용 클라이언트 (변수명 유지)
 * 즉시 실행 함수(IIFE)를 사용하여 서버 환경일 때만 클라이언트를 생성합니다.
 */
export const supabaseAdmin = (() => {
  // 브라우저 환경이거나 키가 없으면 실제 클라이언트를 만들지 않고 null을 반환하거나 가짜 객체를 반환해서 에러를 막습니다.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (typeof window !== 'undefined' || !serviceKey || serviceKey === 'undefined') {
    // 브라우저에서는 null을 반환하지만, 
    // 타입 에러 방지를 위해 as any를 붙여 기존 코드와의 호환성을 유지합니다.
    return null as any; 
  }

  return createClient<Database>(
    supabaseUrl,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
})();