// Header.tsx
import Navbar from 'react-bootstrap/Navbar'
import { Link } from 'react-router-dom'
interface HeaderProps {
  brandName?: string;
  userName?: string;
  userRole?: string;
}

export default function Header({
  brandName = "SAITI_LTD",
  userName = "Saiti_LTD",
  userRole = "Supplier",
}: HeaderProps) {
  const underscoreIdx = brandName.indexOf("_");
  const bold   = brandName.slice(0, underscoreIdx);
  const italic = brandName.slice(underscoreIdx + 1);

  return (
    <Navbar
      className="navbar bg-white border-bottom px-4"
      style={{ height: 60, flexShrink: 0 }}
    >
      {/* Brand */}
      <Navbar.Brand as={Link} to='/' >
        <span
        className="navbar-brand mb-0 h1"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 20,
          fontWeight: 800,
          color: "#111",
          letterSpacing: "-0.5px",
        }}
      >
        {bold}
        <span style={{ fontWeight: 300 }}>_{italic}</span>
      </span>
      </Navbar.Brand>

      {/* User chip — pushed to the right */}
      <div className="d-flex align-items-center gap-2 ms-auto">
        <div
          className="d-flex align-items-center justify-content-center rounded-circle border"
          style={{ width: 36, height: 36, background: "#fafafa" }}
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="#555" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <div className="fw-semibold" style={{ fontSize: 13, color: "#111" }}>
            {userName}
          </div>
          <div className="text-muted" style={{ fontSize: 11 }}>
            {userRole}
          </div>
        </div>
      </div>
    </Navbar>
  );
}