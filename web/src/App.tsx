import { NavLink, Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Films } from "./pages/Films";
import { Types } from "./pages/Types";

export function App() {
  return (
    <div className="app-shell">
      <nav className="app-nav">
        <NavLink to="/" end>
          Dashboard
        </NavLink>
        <NavLink to="/films">Films</NavLink>
        <NavLink to="/types">Types</NavLink>
      </nav>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/films" element={<Films />} />
          <Route path="/types" element={<Types />} />
        </Routes>
      </main>
    </div>
  );
}
