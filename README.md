# Fuse Beads Assistant

[中文](./README.md) | [English](./README.en.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

一个基于 Next.js 16、React 19、shadcn/ui 与 `next-intl` 构建的拼豆助手。

当前核心功能是将图片转换为基于 **Mard 221** 调色板的拼豆图纸，并提供预览、编码图、颜色统计与大图导出能力。

## 功能概览

- 导入 `PNG / JPG / WEBP` 图片并生成拼豆图纸
- 使用 [public/Mard221.csv](/Z:/development/projects/typescript/fuse-beads-assistant/public/Mard221.csv) 进行颜色映射
- 支持 `Preview`、`Coded Chart`、`Coded Chart with Colors`、`Source` 四种工作视图
- 板子尺寸与图片区域尺寸分离
- 默认启用正方形优先工作流
- 支持颜色容差合并，减少实际使用颜色数
- 支持 `smooth` / `precise` 两种取样方式
- 支持独立大图导出页
- 支持中 / 英 / 日 / 韩四种语言
- 支持全局浅色 / 深色 / 跟随系统与多主题色切换

## 路由

首页：

- `/zh`
- `/en`
- `/ja`
- `/ko`

图纸工作台：

- `/zh/pattern`
- `/en/pattern`
- `/ja/pattern`
- `/ko/pattern`

大图导出页：

- `/zh/pattern/export`
- `/en/pattern/export`
- `/ja/pattern/export`
- `/ko/pattern/export`

根路径 `/` 会自动跳转到默认 locale。

## 图纸工作流

### 1. 图片转图纸

导入图片后，系统会根据当前设置生成：

- `Preview`
  色彩量化后的拼豆预览图
- `Coded Chart`
  带网格与颜色代码的图纸
- `Coded Chart with Colors`
  编码图与颜色颗粒数汇总
- `Source`
  原图参考

### 2. 板子尺寸与图片区域分离

图纸生成分为两个层级：

- `Board Size`
  最终板子的像素格子数量
- `Image Area Size`
  图片实际参与转换的区域

图片会先按设定的适配模式放入图片区域，再整体居中到板子中央。板子剩余区域使用 `H2` 填充。

这套设计适合：

- 保持主体居中
- 在更大的板子上留出安全白边
- 制作长方形板子而不破坏主体位置

### 3. 默认工作方式

- 默认板子尺寸为 `52 x 52`
- 默认开启正方形优先
- 内置预设：
  - `52 x 52`
  - `104 x 104`
  - `52 x 104`
  - `104 x 52`

### 4. 适配模式

- `Contain`
- `Cover`
- `Stretch`

### 5. 颜色映射

项目会：

- 读取 `Mard221.csv` 中的颜色标签与十六进制值
- 将图像像素转换到更适合比较差异的颜色空间
- 按最近色进行匹配
- 根据颜色容差合并相近颜色，减少最终颜色数量

如果希望更贴近原图，也可以切换不同取样方式来控制结果风格。

## 大图导出

图纸工作台可打开独立的大图导出页。

导出页支持：

- 完整大图显示，不受工作区宽度限制
- 坐标轴标记
- 可选标题
- 板子尺寸与图片区域尺寸信息
- 颜色代码显示开关
- 下方颜色与颗粒数汇总
- 直接下载导出图片

导出页会根据当前工作台的状态重新生成图纸，以保证与工作台中的图纸结果一致。

## 状态保存规则

### 当前标签页内会保留

- 板子尺寸
- 图片区域尺寸
- 适配模式
- 正方形优先与比例锁定
- 当前 tab
- 缩放相关设置
- 图片标题与轻量配置
- 当前导入图片

### 当前实现方式

- 轻量配置存放在 `sessionStorage`
- 图片数据存放在 `IndexedDB`
- 同标签页切换语言、主题、导出页往返时，图片会保留

### 不会保留的情况

- 完全关闭网页或标签页后，不会恢复旧图片

这样可以避免把大图片数据直接写入 `sessionStorage`，从而减少存储配额问题。

## 国际化

项目使用 `next-intl`。

消息文件：

- [messages/zh.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/zh.json)
- [messages/en.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/en.json)
- [messages/ja.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/ja.json)
- [messages/ko.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/ko.json)

## 主题系统

全局支持：

- 语言切换
- 浅色 / 深色 / 跟随系统
- 主题色切换

当前主题色包括：

- `Peach`
- `Teal`
- `Violet`
- `Amber`
- `Rose`
- `Blush`
- `Mint`
- `Sage`

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Base UI
- `next-intl`

## 目录结构

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

## 关键文件

- 图纸生成核心：
  [lib/bead-pattern.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/bead-pattern.ts)
- 工作台主界面：
  [components/pattern-studio.tsx](/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-studio.tsx)
- 大图导出页：
  [components/pattern-export-viewer.tsx](/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-export-viewer.tsx)
- 轻量状态存储：
  [lib/pattern-studio-state.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/pattern-studio-state.ts)
- 图片存储：
  [lib/pattern-image-store.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/pattern-image-store.ts)

## 本地开发

安装依赖：

```bash
pnpm install
```

启动开发环境：

```bash
pnpm dev
```

默认地址：

```txt
http://localhost:3000
```

## 生产构建

```bash
pnpm build
pnpm start
```

## 后续可扩展方向

- 限制最大颜色数
- 自动分板
- 打印分页
- 导出 JSON / CSV 图纸数据
- 切换不同品牌调色板

## 当前状态

当前版本已经通过生产构建验证：

```bash
pnpm run build
```
