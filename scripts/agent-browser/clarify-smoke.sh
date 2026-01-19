#!/usr/bin/env bash
set -euo pipefail

if ! command -v agent-browser >/dev/null 2>&1; then
  echo "agent-browser 未安装。请先执行：npm install -g agent-browser && agent-browser install"
  exit 1
fi

BASE_URL="${BASE_URL:-http://localhost:5174}"
LOGIN_URL="${LOGIN_URL:-${BASE_URL}/login}"
CHAT_URL="${CHAT_URL:-${BASE_URL}/chat}"
SESSION="${AGENT_BROWSER_SESSION:-wendui}"
EMAIL="${AGENT_BROWSER_EMAIL:-agent+$(date +%s)@example.com}"
PASSWORD="${AGENT_BROWSER_PASSWORD:-Test12345!}"
MESSAGE="${AGENT_BROWSER_MESSAGE:-帮我做个方案}"
SCREENSHOT_PATH="${AGENT_BROWSER_SCREENSHOT:-./.context/agent-browser-clarify.png}"

# 强制有界面模式（非无头）
AB_SESSION=(--session "$SESSION" --headed)

agent-browser open "$LOGIN_URL" "${AB_SESSION[@]}"
# 确保是未登录状态（清理存储与 Cookie）
agent-browser storage local clear "${AB_SESSION[@]}"
agent-browser storage session clear "${AB_SESSION[@]}"
agent-browser cookies clear "${AB_SESSION[@]}"
agent-browser reload "${AB_SESSION[@]}"
agent-browser wait --text "邮箱登录" "${AB_SESSION[@]}"

# 切换到注册，避免已有账号导致登录失败
agent-browser find text "去注册" click "${AB_SESSION[@]}"
agent-browser find placeholder "邮箱" fill "$EMAIL" "${AB_SESSION[@]}"
agent-browser find placeholder "密码" fill "$PASSWORD" "${AB_SESSION[@]}"
agent-browser find text "邮箱注册" click "${AB_SESSION[@]}"

# 等待登录态建立（出现“对话”导航）
agent-browser wait --text "对话" "${AB_SESSION[@]}"

# 强制跳转到聊天页
agent-browser open "$CHAT_URL" "${AB_SESSION[@]}"

# 进入聊天页后发送消息
agent-browser wait 'textarea[placeholder="输入内容，回车发送"]' "${AB_SESSION[@]}"
agent-browser find placeholder "输入内容，回车发送" fill "$MESSAGE" "${AB_SESSION[@]}"
agent-browser find role button click --name "Send message" "${AB_SESSION[@]}"

# 等待澄清链 UI 出现（按钮“完成”）
agent-browser wait --text "完成" "${AB_SESSION[@]}"

# 截图留存
agent-browser screenshot "$SCREENSHOT_PATH" "${AB_SESSION[@]}"
