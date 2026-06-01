# 待办事项应用

一款简洁现代的待办事项管理应用，支持日历视图、到期提醒和优先级排序。所有数据保存在浏览器本地，刷新页面不丢失。

## 功能特性

- **任务管理** — 添加、编辑、删除任务，支持标题和备注说明
- **完成状态** — 一键切换已完成/未完成，已完成任务显示删除线
- **优先级** — 高/中/低三级优先级，以红/琥珀/绿色标签区分
- **截止时间** — 为每个任务设置精确的截止日期和时间
- **到期提醒** — 任务到期自动弹出醒目提醒弹窗，并提供「标记完成」「10 分钟后提醒」「1 小时后提醒」操作
- **桌面通知** — 基于 Notification API 实现系统级桌面推送通知（需用户授权）
- **任务统计** — 顶部卡片实时显示全部/待完成/已完成数量
- **快捷筛选** — 全部 / 待完成 / 今天 / 明天 / 本周 / 已过期 / 已完成
- **灵活排序** — 按优先级、截止时间、创建时间、任务名称排序
- **实时搜索** — 输入关键词即时过滤任务标题和备注
- **日历视图** — 月视图日历，任务以彩色标签显示在对应日期；列表视图按截止时间排列
- **过期警告** — 已过期任务以红色高亮并显示警告横幅
- **响应式设计** — 移动端优先布局，大屏幕内容居中（最大宽度 960px），手机/平板/桌面均适配
- **数据持久化** — 基于 localStorage 保存，关闭浏览器后数据依然保留

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 18 + TypeScript |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS 3 + CSS 自定义属性设计系统 |
| 图标 | Lucide React |
| 存储 | localStorage（JSON 序列化） |
| 通知 | Web Notification API |
| 时间 | 原生 Date 对象 |

## 项目结构

```
TodoList_v2/
├── index.html                  # 入口 HTML
├── package.json                # 依赖与脚本
├── vite.config.ts              # Vite 构建配置
├── tailwind.config.ts          # Tailwind 主题与设计 Token
├── tsconfig.json               # TypeScript 配置
├── postcss.config.js           # PostCSS 配置
├── public/                     # 静态资源
│   └── hero-illustration.png   # 应用插图
└── src/
    ├── main.tsx                # 应用入口，挂载 React 根组件
    ├── App.tsx                 # 主组件：状态管理、布局、视图切换
    ├── index.css               # CSS 设计系统（变量、渐变、阴影、组件类）
    ├── vite-env.d.ts           # Vite 类型声明
    ├── types/
    │   └── index.ts            # TypeScript 类型定义（Task、Priority、FilterKey 等）
    ├── lib/
    │   └── utils.ts            # 工具函数（日期格式化、筛选、排序、提醒检测）
    ├── hooks/
    │   ├── useTasks.ts         # 核心状态 Hook：CRUD、localStorage 同步、提醒定时器
    │   └── useNotification.ts  # 浏览器通知 Hook：权限请求、通知发送
    └── components/
        ├── TaskItem.tsx        # 任务卡片组件（复选框、标题、优先级、截止时间、操作按钮）
        ├── TaskForm.tsx        # 任务添加/编辑弹窗表单
        ├── CalendarView.tsx    # 日历视图（月视图 + 列表视图）
        ├── ReminderModal.tsx   # 到期提醒弹窗
        ├── PriorityBadge.tsx   # 优先级标签组件
        └── ui/
            ├── button.tsx      # Button 组件（CVA 变体系统）
            └── card.tsx        # Card 容器组件
```

## 核心实现逻辑

### 1. 数据模型

任务对象 `Task` 的字段设计如下：

```typescript
interface Task {
  id: string           // 唯一标识，基于时间戳 + 随机字符串生成
  title: string        // 任务标题（必填）
  description?: string // 备注说明（选填）
  completed: boolean   // 完成状态
  priority: Priority   // 优先级：'high' | 'medium' | 'low'
  dueDate?: string     // 截止时间（ISO 8601 字符串，选填）
  createdAt: string    // 创建时间（ISO 8601）
  updatedAt: string    // 最后更新时间（ISO 8601）
  reminderShown?: boolean   // 是否已弹出过提醒（防止重复提醒）
  snoozedUntil?: string     // 贪睡到期时间（ISO 8601，用于「稍后提醒」）
}
```

`reminderShown` 和 `snoozedUntil` 两个辅助字段协同控制提醒行为：首次到期时 `reminderShown` 为 `false`，触发提醒后置为 `true`；用户选择贪睡时，设置 `snoozedUntil` 并重置 `reminderShown`，确保贪睡期间不会重复提醒、贪睡结束后再次触发。

### 2. 数据存储

采用 `localStorage` 以 JSON 格式持久化整个任务数组：

- **初始化**：`useTasks` 的 `useState` 使用惰性初始化，首次加载时从 `localStorage` 读取；若无可读数据则生成含 5 条示例任务的默认列表，让用户立即看到完整界面效果
- **写入**：通过 `useEffect` 监听 `tasks` 状态变化，每次变更自动序列化写入，确保数据实时同步
- **容错**：读取时包裹 `try/catch`，解析失败时回退到默认数据，避免 JSON 损坏导致白屏

存储键名为 `todo-app-tasks`，整份数据以单一 JSON 字符串存储。

### 3. 任务 CRUD

所有操作通过 `useTasks` Hook 暴露，使用 React `useCallback` 包裹确保引用稳定：

- **添加（addTask）**：生成唯一 `id` 和时间戳，插入到数组头部
- **修改（updateTask）**：通过 `id` 匹性匹配，合并更新字段并刷新 `updatedAt`
- **删除（deleteTask）**：过滤移除目标任务，同时清理提醒队列中的对应项
- **切换完成（toggleTask）**：翻转 `completed` 状态，同步更新 `updatedAt`

删除操作在 UI 层添加了 200ms 的淡出动画（先设置 `deleting` 状态触发 CSS 过渡，延迟后真正移除），提升交互体感。

### 4. 排序与筛选

**筛选**（`filterTasks`）基于 `FilterKey` 类型实现 7 种过滤策略：

| 筛选项 | 逻辑 |
|--------|------|
| 全部 | 返回所有任务 |
| 待完成 | `completed === false` |
| 已完成 | `completed === true` |
| 今天 | 截止日期年月日匹配今天，且未完成 |
| 明天 | 截止日期年月日匹配明天，且未完成 |
| 本周 | 截止日期在本周范围内，且未完成 |
| 已过期 | 截止时间早于当前时间，且未完成 |

**排序**（`sortTasks`）始终将已完成任务排到末尾，然后按所选维度排序：

- **优先级**：高(0) → 中(1) → 低(2)
- **截止时间**：无截止日期排末尾，有截止日期按时间升序
- **创建时间**：新创建的排前面（降序）
- **任务名称**：中文 `localeCompare` 字母排序

### 5. 提醒功能

提醒系统由三层协作完成：

**a) 定时检测**：`useTasks` 内部通过 `setInterval` 每 30 秒执行一次检查。核心函数 `shouldTriggerReminder` 判断逻辑为：
1. 任务必须设置了截止时间且未完成
2. 当前时间已到达或超过截止时间
3. 若处于贪睡期间（`snoozedUntil` 未到期），不触发
4. 若已提醒过（`reminderShown === true`）且未重新贪睡，不触发

符合条件的任务加入 `pendingReminders` 队列（去重：已存在于队列中的不再重复添加）。

**b) 弹窗提醒**：`ReminderModal` 组件在检测到 `pendingReminders` 非空时渲染，显示任务标题、备注、截止时间，提供三个操作：
- 「标记为已完成」→ 调用 `toggleTask` + 关闭弹窗
- 「10 分钟后提醒」→ 设置 `snoozedUntil = now + 10min`
- 「1 小时后提醒」→ 设置 `snoozedUntil = now + 60min`

弹窗使用 `z-[100]` 确保始终在最上层，配合 `animate-bounce-in` 弹性动画吸引注意。

**c) 桌面通知**：`useNotification` Hook 封装了 Notification API：
- `requestPermission()`：请求浏览器通知权限，返回是否授权
- `sendNotification(title, body)`：在权限已授予时创建系统通知，设置 `requireInteraction: true` 使通知不会自动消失，点击通知时聚焦窗口

提醒触发时，弹窗和桌面通知同时发送，确保用户不会错过。

### 6. UI 渲染

- **任务列表**：`TaskItem` 组件接收单条任务数据，根据 `completed`、`overdue` 状态动态组合 CSS 类名；操作按钮（编辑/删除）默认隐藏，鼠标悬停时渐显
- **统计数字**：`useTasks` 每次渲染时实时计算 `stats`（total/pending/completed/overdue），由顶部三张统计卡片展示
- **日历视图**：`CalendarView` 计算当月天数和首日偏移，生成 7 列网格；任务按日期分组后以缩略标签形式嵌入日期格中；点击日期展开该日任务列表
- **响应式**：主容器 `max-w-app`（960px）+ `mx-auto` 居中；移动端显示悬浮添加按钮，桌面端使用顶部按钮；筛选标签区横向滚动避免换行
- **设计系统**：所有视觉 Token（颜色、阴影、渐变、圆角、动画）统一定义在 `src/index.css` 的 CSS 自定义属性和 `tailwind.config.ts` 中，组件通过语义类名引用

## 使用说明

### 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

开发服务器启动后，在浏览器中打开终端输出的地址（默认 `http://localhost:5173`）。

### 基本操作

1. **添加任务**：点击右上角「添加任务」按钮（移动端为右下角悬浮按钮），填写标题、优先级和截止时间后提交
2. **编辑任务**：鼠标悬停在任务卡片上，点击铅笔图标进入编辑模式
3. **删除任务**：鼠标悬停在任务卡片上，点击垃圾桶图标
4. **完成任务**：点击任务左侧的复选框切换完成状态
5. **查看日历**：点击顶部视图切换按钮，从列表视图切换到日历视图
6. **筛选任务**：使用搜索框下方的标签按钮快速切换筛选条件
7. **排序切换**：点击任务计数右侧的排序按钮，选择排序维度

### 浏览器通知

首次使用时，点击顶部的铃铛图标请求通知权限。授权后，当任务到期时除了页面内弹窗提醒外，还会收到系统级桌面通知。

通知权限状态指示：
- 灰色铃铛 = 未授权或已拒绝
- 绿色铃铛 = 已授权，将收到桌面通知
- 铃铛带红点 = 有待处理的提醒

### 数据存储

所有任务数据保存在浏览器的 `localStorage` 中，关闭标签页或刷新页面后数据依然保留。清除浏览器数据会导致任务丢失。

## 注意事项

- 首次使用需点击铃铛图标允许浏览器通知权限，否则仅能收到页面内弹窗提醒
- 建议在 Chrome、Edge、Firefox 等现代浏览器中使用，以获得最佳体验
- 桌面通知在浏览器最小化时仍然有效，但需保持浏览器进程运行
- 提醒检测间隔为 30 秒，到期后最多延迟 30 秒触发
- `localStorage` 容量通常为 5MB，足以存储数千条任务
