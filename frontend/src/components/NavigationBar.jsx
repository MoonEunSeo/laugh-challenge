import { Link } from "react-router-dom";
import "./NavigationBar.css";

export default function NavigationBar() {
  return (
    <nav className="nav">
      <div className="nav-left">
        <Link to="/" className="nav-logo">😂 웃참 챌린지</Link>
      </div>

      <div className="nav-right">
        <Link to="/" className="nav-item">홈</Link>
        <Link to="/leaderboard1" className="nav-item">명예의 전당</Link>
        <Link to="/report" className="nav-item">성향 분석</Link>
        <Link to="/challenge" className="nav-item">챌린지</Link>
        <Link to="/help" className="nav-item">도움말</Link>
      </div>
    </nav>
  );
}
