# ItemMemo 物记

> 一款本地优先、离线可用的个人物品管理应用，帮助你记录物品、识别闲置与高成本，并通过提醒和统计做更清晰的个人资产管理。

![platform](https://img.shields.io/badge/platform-uni--app-2b7fff)
![vue](https://img.shields.io/badge/Vue-3.4-42b883)
![typescript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![vite](https://img.shields.io/badge/Vite-5.x-646cff)

## 功能特性

- 物品管理：新增、编辑、删除、详情查看
- 分类管理：新增、重命名、迁移、删除校验
- 首页总览：总物品数、总花费、待提醒、本月新增、日均成本
- 提醒中心：系统提醒（高日均成本、闲置检查）+ 自定义提醒
- 统计分析：按日/按月/按年趋势、分类占比、闲置情况
- 数据迁移：JSON 导出与导入，支持备份与换机
- 主题模式：明暗主题切换
- 首次引导：快速上手流程

## 功能截图

> 点击图片可查看大图。

### 首页与列表

| 首页总览 | 物品列表 |
| --- | --- |
| [![首页总览](https://github.com/user-attachments/assets/b7265610-90ec-4d85-99ef-7c275cde885c)](https://github.com/user-attachments/assets/b7265610-90ec-4d85-99ef-7c275cde885c) | [![物品列表](https://github.com/user-attachments/assets/1742fe94-034f-4d0c-9c08-c17be8c4d239)](https://github.com/user-attachments/assets/1742fe94-034f-4d0c-9c08-c17be8c4d239) |

### 新增与统计

| 新增 | 统计分析 |
| --- | --- |
| [![新增](https://github.com/user-attachments/assets/9b507480-9c1a-4f63-ad16-5796f2f3dd5e)](https://github.com/user-attachments/assets/9b507480-9c1a-4f63-ad16-5796f2f3dd5e) | [![统计分析](https://github.com/user-attachments/assets/25dcde74-cb3d-487a-b9b7-51f63df91314)](https://github.com/user-attachments/assets/25dcde74-cb3d-487a-b9b7-51f63df91314) |

### 我的页面

| 我的页面 |
| --- |
| [![我的页面](https://github.com/user-attachments/assets/a9252db8-215a-4a38-8f15-8a375333bb30)](https://github.com/user-attachments/assets/a9252db8-215a-4a38-8f15-8a375333bb30) |

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+
- HBuilderX 或支持 uni-app 的开发环境

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev:h5
```

### 构建产物

```bash
npm run build:h5
```

### 微信小程序调试

```bash
npm run dev:mp-weixin
```

## 项目结构

```text
ItemMemo/
├─ src/
│  ├─ components/            # 通用组件
│  ├─ pages/                 # 页面
│  │  ├─ dashboard/          # 首页总览
│  │  ├─ items/              # 物品列表/详情/编辑
│  │  ├─ add/                # 新增物品
│  │  ├─ categories/         # 分类管理
│  │  ├─ reminders/          # 提醒中心
│  │  ├─ analytics/          # 统计分析
│  │  ├─ data-export/        # 数据导入导出
│  │  ├─ me/                 # 个人中心
│  │  ├─ settings/           # 设置
│  │  └─ onboarding/         # 引导页
│  ├─ services/              # 业务服务层
│  ├─ storage/               # 本地存储封装
│  ├─ utils/                 # 工具函数
│  ├─ types.ts               # 全局类型定义
│  ├─ pages.json             # 路由与页面配置
│  └─ manifest.json          # 应用清单
├─ static/                   # 静态资源
├─ scripts/                  # 工程脚本
├─ package.json
└─ README.md
```

## 数据与隐私

- 数据默认保存在本地存储
- 不依赖强制登录即可使用核心功能
- 提供 JSON 导出/导入能力，便于用户自行备份与迁移

## 开发计划

- [ ] 支持 CSV 导出
- [ ] 支持图片附件与物品照片
- [ ] 增加多条件筛选与高级排序
- [ ] 增加预算与消费目标看板
- [ ] 增加周期性提醒模板
- [ ] 提供 Web 端共享只读报表

## 贡献指南

欢迎提交 Issue 与 Pull Request。

### 提交流程

1. Fork 本仓库
2. 新建功能分支
3. 提交代码并附带说明
4. 发起 Pull Request

### 建议规范

- 提交前确保本地可运行
- 变更尽量保持单一职责
- 若涉及 UI 变更，建议附截图
- Commit Message 建议遵循 Conventional Commits

示例：

```text
feat(reminder): add custom reminder quick create
fix(analytics): correct day trend window
docs(readme): update quick start section
```

## License

本项目采用 MIT License，详见 [LICENSE](LICENSE)。
