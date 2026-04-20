# Fuse Beads Assistant

一个基于 Next.js 16、shadcn/ui 和 `next-intl` 的拼豆助手项目。

当前核心能力是“图纸转换器”:

- 导入图片并转换为拼豆图纸
- 使用 `public/Mard221.csv` 作为颜色映射表
- 支持正方形优先的板子工作流
- 支持中 / 英 / 日 / 韩四种语言
- 支持全局浅色 / 深色 / 跟随系统
- 支持主题色切换
- 支持预览图、编码图、编码图+颜色统计

## 在线路由

项目使用 locale 路由:

- `/zh`
- `/en`
- `/ja`
- `/ko`

图纸转换器页面:

- `/zh/pattern`
- `/en/pattern`
- `/ja/pattern`
- `/ko/pattern`

根路径 `/` 会自动跳转到 `/zh`。

## 当前功能

### 1. 图片转图纸

导入 PNG / JPG / WEBP 图片后，可以将图片转换为拼豆图纸。

转换结果包括:

- `Preview`
  色彩量化后的拼豆预览
- `Coded Chart`
  带网格和编码的图纸
- `Coded Chart With Colors`
  带编码图纸，并在下方附带颜色和颗粒数
- `Source`
  原图参考

### 2. Mard 221 颜色匹配

颜色来源于:

- [public/Mard221.csv](/Z:/development/projects/typescript/fuse-beads-assistant/public/Mard221.csv)

当前实现会:

- 解析 CSV 中的 `HEX` 和 `Tag`
- 将图片像素转为 Lab 色彩空间
- 用最近色匹配方式映射到 Mard 221 色表

### 3. 板子尺寸与图片区域分离

转换逻辑分成两层:

- 板子尺寸 `board width x board height`
- 图片区域尺寸 `image area width x image area height`

图片会先在“图片区域”中按比例居中，再整体放入板子中央。

这意味着:

- 如果板子比图片区域更大，主体不会跑偏
- 如果原图本身存在留白，主体仍然优先保持居中
- 长方形板子空白区域会使用 `H2` 填充

### 4. 正方形优先工作流

默认行为:

- 默认开启“正方形优先”
- 默认尺寸为 `52 x 52`

启用后:

- 板子宽高自动保持一致
- 图片区域默认也同步为正方形

如果关闭该选项:

- 可以分别设置板子宽高
- 可以做长方形图纸

### 5. 板子预设

当前内置预设:

- `52 x 52`
- `104 x 104`
- `52 x 104`
- `104 x 52`

### 6. 当前会话内状态保留

以下内容会保存在当前标签页的 `sessionStorage` 中:

- 当前导入图片
- 板子尺寸
- 图片区域尺寸
- 适配模式
- 正方形优先开关
- 比例锁定开关
- 图纸缩放
- 当前 tab

因此在同一个标签页内，以下操作后不需要重新导入图片:

- 切换语言
- 切换深浅色
- 切换主题色

注意:

- 关闭整个网页或标签页后，不会保留旧图片
- 大图导出页不会读取历史持久缓存
- 大图导出页只会在“原图纸页面仍然打开并且当前有图”的情况下拿到导出数据
- 大图导出页拿到的是“已经生成完成的图纸数据”，不会自己再重新计算一遍
- 大图导出页收到这份数据后，会同步写入当前导出标签页的 `sessionStorage`
- 所以从大图页返回图纸生成器页时，图片和参数仍然会保留

### 7. 国际化

使用 `next-intl` 实现。

当前消息文件:

- [messages/zh.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/zh.json)
- [messages/en.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/en.json)
- [messages/ja.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/ja.json)
- [messages/ko.json](/Z:/development/projects/typescript/fuse-beads-assistant/messages/ko.json)

### 8. 主题系统

顶栏支持:

- 语言切换
- 主题模式切换
- 主题色切换

主题模式:

- `System`
- `Light`
- `Dark`

主题色:

- `Peach`
- `Teal`
- `Violet`
- `Amber`

### 9. 大图导出模式

图纸生成器支持打开独立的大图导出页。

大图导出页地址:

- `/zh/pattern/export`
- `/en/pattern/export`
- `/ja/pattern/export`
- `/ko/pattern/export`

大图导出页包含:

- 不受工作区宽度限制的完整大图 canvas
- 带每像素颜色代号的编码图纸
- 图纸下方的颜色颗粒汇总
- 下载按钮

导出页数据来源规则:

- 必须由当前仍打开着的图纸生成器页实时提供
- 导出页直接复用图纸生成器当前已经生成好的结果，因此会严格保持板子宽高、图片区域大小与居中结果一致
- 如果原页面没有图片，或者原页面已经关闭，则导出页会显示无可导出数据
- 不会跨浏览器重启保留旧图

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Base UI
- next-intl

## 目录结构

```txt
app/
  [locale]/
    page.tsx
    pattern/page.tsx
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
  pattern-studio-state.ts

messages/
  zh.json
  en.json
  ja.json
  ko.json

public/
  Mard221.csv
```

## 本地开发

安装依赖:

```bash
pnpm install
```

启动开发环境:

```bash
pnpm dev
```

打开:

```txt
http://localhost:3000
```

## 构建

生产构建:

```bash
pnpm build
```

启动生产环境:

```bash
pnpm start
```

## 关键实现文件

图纸核心逻辑:

- [lib/bead-pattern.ts](/Z:/development/projects/typescript/fuse-beads-assistant/lib/bead-pattern.ts)

图纸工作台 UI:

- [components/pattern-studio.tsx](/Z:/development/projects/typescript/fuse-beads-assistant/components/pattern-studio.tsx)

国际化路由:

- [i18n/routing.ts](/Z:/development/projects/typescript/fuse-beads-assistant/i18n/routing.ts)
- [i18n/request.ts](/Z:/development/projects/typescript/fuse-beads-assistant/i18n/request.ts)
- [proxy.ts](/Z:/development/projects/typescript/fuse-beads-assistant/proxy.ts)

全局主题:

- [app/layout.tsx](/Z:/development/projects/typescript/fuse-beads-assistant/app/layout.tsx)
- [app/globals.css](/Z:/development/projects/typescript/fuse-beads-assistant/app/globals.css)

## 图纸生成规则说明

当前图纸生成流程:

1. 读取原图
2. 根据“图片区域尺寸”和 `fitMode` 计算图片绘制区域
3. 将图片区域居中放入板子区域
4. 对整个板子逐像素进行颜色采样
5. 将像素匹配到 Mard 221 最近色
6. 输出预览图、编码图和颜色统计

补边规则:

- 默认长方形空白区域使用 `H2`

适配模式:

- `Contain`
- `Cover`
- `Stretch`

## 适合继续扩展的方向

- 限制最大颜色数
- 自动分板
- 打印分页
- 导出带色表的整张 PNG
- 导出 JSON / CSV 图纸数据
- 按颗粒品牌切换不同调色板

## 当前状态

当前版本已经通过生产构建验证:

```bash
pnpm run build
```
