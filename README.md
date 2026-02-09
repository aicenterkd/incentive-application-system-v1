# 썬키스트 인센티브 신청 시스템

썬키스트 2종 마트 신규 입점 인센티브 신청 및 관리 시스템입니다.

## 📋 프로젝트 개요

이 시스템은 썬키스트 제품의 마트 신규 입점 인센티브 신청을 온라인으로 처리하고 관리할 수 있는 웹 기반 시스템입니다. 대리점 직원들이 간편하게 신청서를 작성하고, 관리자가 신청 내역을 확인하고 승인/거부할 수 있습니다.

### 주요 기능

- **인센티브 신청서 작성**
  - 대리점 정보 입력 (대리점명, 담당자명, 직원명)
  - 마트 정보 입력 (상호명, 주소)
  - 파일 업로드 (제품 진열 사진, 마트 간판 사진, 거래명세서)
  - 계좌 정보 입력 (은행명, 계좌번호)
  - 진행률 표시

- **관리자 대시보드**
  - 신청서 목록 조회 및 상세 확인
  - 통계 정보 (전체/대기/승인/거부 건수, 총 인센티브 금액)
  - 대리점별 참여 현황
  - 신청서 승인/거부 처리
  - Excel 다운로드 기능

- **인증 시스템**
  - 관리자 로그인/로그아웃
  - 세션 관리

## 🛠 기술 스택

### 프론트엔드
- **Next.js 16.1.6** - React 프레임워크 (App Router)
- **React 19** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **Radix UI** - 접근성 있는 UI 컴포넌트
- **shadcn/ui** - UI 컴포넌트 라이브러리
- **Lucide React** - 아이콘
- **React Hook Form** - 폼 관리
- **Zod** - 스키마 검증

### 백엔드 & 데이터베이스
- **Supabase** - 백엔드 서비스 (데이터베이스, 스토리지)
- **Next.js API Routes** - 서버 API

### 기타
- **date-fns** - 날짜 처리
- **recharts** - 차트 라이브러리
- **next-themes** - 다크 모드 지원

## 📁 프로젝트 구조

```
incentive-application-system/
├── app/                      # Next.js App Router
│   ├── admin/               # 관리자 페이지
│   │   └── page.tsx
│   ├── api/                 # API 라우트
│   │   ├── applications/    # 신청서 API
│   │   ├── auth/            # 인증 API
│   │   └── stores/          # 매장 정보 API
│   ├── layout.tsx           # 루트 레이아웃
│   ├── page.tsx             # 메인 신청서 페이지
│   └── globals.css          # 전역 스타일
├── components/              # 재사용 가능한 컴포넌트
│   ├── admin/              # 관리자 전용 컴포넌트
│   ├── ui/                 # UI 컴포넌트 (shadcn/ui)
│   ├── file-upload.tsx     # 파일 업로드 컴포넌트
│   └── theme-provider.tsx  # 테마 제공자
├── hooks/                  # 커스텀 훅
├── lib/                    # 유틸리티 및 라이브러리
│   ├── supabase/           # Supabase 클라이언트 및 타입
│   ├── store.ts            # 타입 정의
│   └── utils.ts            # 유틸리티 함수
├── public/                 # 정적 파일
└── styles/                 # 스타일 파일
```

## 🚀 시작하기

### 사전 요구사항

- Node.js 18 이상
- pnpm (또는 npm, yarn)
- Supabase 계정 및 프로젝트

### 설치

1. 저장소 클론
```bash
git clone <repository-url>
cd incentive-application-system
```

2. 의존성 설치
```bash
pnpm install
# 또는
npm install
# 또는
yarn install
```

3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> 💡 **참고**: 환경 변수는 `.env.local` 파일에서 수정할 수 있습니다. 수정 후 개발 서버를 재시작해야 변경사항이 적용됩니다.

### 개발 서버 실행

```bash
pnpm dev
# 또는
npm run dev
# 또는
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

프로덕션 빌드를 생성하려면:

```bash
pnpm build
pnpm start
```

## 📝 사용 방법

### 신청서 작성

1. 메인 페이지에서 신청서 양식을 작성합니다.
2. 필수 항목을 모두 입력합니다:
   - 대리점명
   - 본사 담당자명
   - 대리점 직원명
   - 마트 상호명 (검색 가능)
   - 마트 주소
   - 제품 진열 사진 (1-2장)
   - 마트 외부 간판 사진 (1장)
   - 거래명세서 (1-2장)
   - 은행명
   - 계좌번호
3. "신청 완료하기" 버튼을 클릭하여 제출합니다.

### 관리자 로그인

1. 메인 페이지 우측 상단의 설정 아이콘을 클릭합니다.
2. 관리자 아이디와 비밀번호를 입력합니다.
3. 로그인 후 관리자 대시보드에서 신청서를 확인하고 관리할 수 있습니다.
4. 기본 아이디와 비밀번호는 `admin` / `$init0000` 입니다.
5. 아이디와 비밀번호를 변경하려면 `app/api/auth/route.ts` 파일에서 `ADMIN_ID`와 `ADMIN_PW` 상수를 수정하면 됩니다.

### 관리자 기능

- **통계 확인**: 전체 신청 건수, 승인/거부 현황, 총 인센티브 금액 확인
- **대리점별 현황**: 대리점별 참여 건수 확인
- **신청서 관리**: 각 신청서의 상세 정보 확인 및 승인/거부 처리
- **Excel 다운로드**: 승인/반려가 결정된 신청서 데이터를 Excel 파일로 다운로드 (대기 상태의 신청서는 제외)

## 🔧 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | ✅ |

> 💡 **참고**: 환경 변수는 `.env.local` 파일에서 수정할 수 있습니다. 수정 후 개발 서버를 재시작해야 변경사항이 적용됩니다.

## 📄 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 📞 문의

AI센터 채지혜
                                 
