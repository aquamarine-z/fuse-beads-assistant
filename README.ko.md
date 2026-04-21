# Fuse Beads Assistant

[中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

Next.js 16, React 19, shadcn/ui, `next-intl`로 만든 퓨즈 비즈 도안 작업 도구입니다.

핵심 기능은 업로드한 이미지를 **Mard 221** 팔레트 기준의 비즈 도안으로 변환하고, 미리보기, 코드 도안, 색상 통계, 대형 내보내기까지 제공하는 것입니다.

## 주요 기능

- `PNG / JPG / WEBP` 이미지를 불러와 비즈 도안으로 변환
- [public/Mard221.csv](/Z:/development/projects/typescript/fuse-beads-assistant/public/Mard221.csv)를 색상 팔레트로 사용
- `Preview`, `Coded Chart`, `Coded Chart with Colors`, `Source` 뷰 전환
- 보드 크기와 이미지 영역 크기를 분리해서 설정
- 정사각형 우선 워크플로 기본 활성화
- 허용 오차로 비슷한 색을 합쳐 사용 색상 수 감소
- `smooth` / `precise` 샘플링 방식 선택
- 별도의 대형 내보내기 페이지 제공
- `zh / en / ja / ko` 지원
- 전역 라이트 / 다크 / 시스템 및 포인트 색상 전환 지원

## 라우트

홈:

- `/zh`
- `/en`
- `/ja`
- `/ko`

도안 스튜디오:

- `/zh/pattern`
- `/en/pattern`
- `/ja/pattern`
- `/ko/pattern`

대형 내보내기:

- `/zh/pattern/export`
- `/en/pattern/export`
- `/ja/pattern/export`
- `/ko/pattern/export`

루트 경로 `/` 는 기본 locale 로 이동합니다.

## 도안 작업 흐름

### 1. 이미지에서 도안으로

이미지를 불러오면 다음 뷰를 생성할 수 있습니다.

- `Preview`
  양자화된 비즈 스타일 미리보기
- `Coded Chart`
  그리드와 색상 코드가 있는 도안
- `Coded Chart with Colors`
  코드 도안과 색상별 비즈 수
- `Source`
  원본 이미지 참조

### 2. 보드 크기와 이미지 영역

생성기는 다음 두 값을 따로 다룹니다.

- `Board Size`
  최종 비즈 판의 격자 크기
- `Image Area Size`
  원본 이미지를 배치하고 변환하는 영역

이미지는 먼저 이미지 영역 안에 맞춰지고, 그다음 보드 중앙에 배치됩니다. 남는 보드 영역은 `H2` 로 채워집니다.

이 구조는 다음과 같은 작업에 잘 맞습니다.

- 피사체를 중앙에 유지
- 큰 보드에 자연스러운 여백 추가
- 직사각형 보드에서도 중심이 흐트러지지 않게 유지

### 3. 기본 설정

- 기본 보드 크기: `52 x 52`
- 정사각형 우선 기본 활성화
- 내장 프리셋:
  - `52 x 52`
  - `104 x 104`
  - `52 x 104`
  - `104 x 52`

### 4. 맞춤 방식

- `Contain`
- `Cover`
- `Stretch`

### 5. 색상 매핑

앱은 다음 과정을 거칩니다.

- `Mard221.csv` 에서 색상 태그와 HEX 값을 읽음
- 픽셀 색을 비교하기 좋은 색 공간으로 변환
- 가장 가까운 팔레트 색으로 매핑
- 필요하면 허용 오차를 이용해 가까운 색을 병합

원본에 더 가깝게 할지, 좀 더 부드럽게 만들지에 따라 샘플링 방식을 바꿀 수 있습니다.

## 대형 내보내기

스튜디오에서 별도의 대형 내보내기 페이지를 열 수 있습니다.

내보내기 페이지에는 다음이 포함됩니다.

- 스튜디오 폭 제한을 받지 않는 큰 도안 표시
- 좌표 라벨
- 선택형 제목
- 보드 크기와 이미지 영역 크기 정보
- 색상 코드 표시 토글
- 도안 아래 색상별 비즈 수 요약
- 이미지 다운로드

이 페이지는 현재 스튜디오 설정을 기준으로 다시 그려서 작업 화면과 결과를 맞춥니다.

## 상태 유지 규칙

### 현재 탭에서 유지되는 항목

- 보드 크기
- 이미지 영역 크기
- 맞춤 방식
- 정사각형 우선과 비율 잠금
- 현재 탭
- 확대 관련 설정
- 이미지 제목 등 가벼운 설정
- 현재 불러온 이미지

### 저장 방식

- 가벼운 설정은 `sessionStorage`
- 이미지 데이터는 `IndexedDB`
- 같은 탭 안에서 언어 변경, 테마 변경, 내보내기 페이지 이동 후 복귀 시 이미지 유지

### 유지되지 않는 항목

- 페이지나 브라우저 탭을 완전히 닫은 뒤의 예전 이미지

이 방식으로 큰 이미지 데이터를 `sessionStorage` 에 직접 넣지 않아 저장 용량 문제를 줄였습니다.

## 국제화

`next-intl` 을 사용합니다.

메시지 파일:

- [messages/zh.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/zh.json)
- [messages/en.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/en.json)
- [messages/ja.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/ja.json)
- [messages/ko.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/ko.json)

## 테마 시스템

전역으로 다음 기능을 지원합니다.

- 언어 전환
- 라이트 / 다크 / 시스템
- 포인트 색상 전환

현재 포인트 색상:

- `Peach`
- `Teal`
- `Violet`
- `Amber`
- `Rose`
- `Blush`
- `Mint`
- `Sage`

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Base UI
- `next-intl`

## 프로젝트 구조

```txt
app/
  [locale]/
    page.tsx
    pattern/page.tsx
    pattern/export/page.tsx
  layout.tsx
  page.tsx

components/
  locale-switcher.tsx
  pattern-export-viewer.tsx
  pattern-studio.tsx
  theme-switcher.tsx
  titlebar-controls.tsx
  ui/

i18n/
  navigation.ts
  request.ts
  routing.ts

lib/
  bead-pattern.ts
  pattern-image-store.ts
  pattern-studio-state.ts

messages/
  zh.json
  en.json
  ja.json
  ko.json

public/
  Mard221.csv
```

## 주요 파일

- 도안 생성 로직:
  [lib/bead-pattern.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/bead-pattern.ts)
- 스튜디오 UI:
  [components/pattern-studio.tsx](/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-studio.tsx)
- 대형 내보내기 페이지:
  [components/pattern-export-viewer.tsx](/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-export-viewer.tsx)
- 가벼운 상태 저장:
  [lib/pattern-studio-state.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/pattern-studio-state.ts)
- 이미지 저장:
  [lib/pattern-image-store.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/pattern-image-store.ts)

## 로컬 개발

의존성 설치:

```bash
pnpm install
```

개발 서버 실행:

```bash
pnpm dev
```

기본 주소:

```txt
http://localhost:3000
```

## 프로덕션 빌드

```bash
pnpm build
pnpm start
```

## 확장 아이디어

- 최대 색상 수 제한
- 여러 보드로 자동 분할
- 인쇄용 페이지 분할
- JSON / CSV 도안 데이터 내보내기
- 다른 브랜드 팔레트 지원

## 상태

현재 버전은 프로덕션 빌드 검증을 통과했습니다.

```bash
pnpm run build
```
