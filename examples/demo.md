# AI 时代的工程师工具箱

> 一份轻量的排版演示稿，展示 md2wechat 支持的所有排版元素。点击右上角主题可随时换肤。

## 一、核心工具链

AI 时代的工程师，不再只是写代码的人，而是**会用工具放大生产力的人**。

- **代码编辑器**：VS Code / Neovim，配合 AI 插件实现智能补全
  - 关键配置：`editor.formatOnSave` + `editor.codeActionsOnSave`
  - 推荐插件：GitHub Copilot / Cursor / Trae
- **终端工具**：iTerm2 / Warp，配合 Oh My Zsh 提升效率
- **笔记系统**：Obsidian / Logseq，构建个人知识图谱

> 工具不会替代人，但会用工具的人会替代不会用的人。

## 二、效率演示区

### 代码块（Mac 视窗风）

```python
def ai_workflow(prompt: str) -> str:
    """AI 工作流：提示词 → 模型 → 结果校验"""
    result = model.generate(prompt)
    verified = verify(result)
    return verified if verified else retry(prompt)
```

### 表格 · 工具对比

| 类别 | 工具 | 核心优势 | 学习成本 |
| :--- | :--: | :-----: | ---: |
| 编辑器 | VS Code | 生态丰富 | 低 |
| 终端 | Warp | AI 原生 | 中 |
| 笔记 | Obsidian | 本地优先 | 中 |
| 自动化 | n8n | 可视化编排 | 高 |

### 图片占位与图注

![AI 时代的工程师工作台示意图](https://example.com/workspace.jpg)

*图注：工具是放大器，人才是核心。*

## 三、我的工具观

工具不是目的，**解决问题才是**。选择工具的标准：能不能帮你更快、更好、更稳地解决问题。

---

**行途技术手记** | 关注 AI 时代的工程师成长与效率提升。
排版 | md2wechat 行途排版引擎（v2.2）\
声明：未经授权，禁止抓取本文用于训练 AI 大模型。
