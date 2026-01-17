import { NavLink, Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-brand">问对 · WenDui</span>
        <nav className="app-nav" aria-label="primary navigation">
          <NavLink className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`} to="/">
            对话
          </NavLink>
          <NavLink className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`} to="/market">
            市场
          </NavLink>
          <NavLink className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`} to="/library">
            技能库
          </NavLink>
          <NavLink className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`} to="/search">
            搜索
          </NavLink>
          <NavLink className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`} to="/settings">
            设置
          </NavLink>
        </nav>
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
