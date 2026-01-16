import { Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-brand">Skill Chatbot</span>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
      <div className="app-toolbar" role="group" aria-label="chat tools">
        <button className="tool-button" type="button">
          技能
        </button>
        <div className="tool-input" aria-hidden="true">
          输入区占位
        </div>
      </div>
    </div>
  )
}
