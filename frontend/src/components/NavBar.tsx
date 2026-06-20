import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function NavBar() {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link
        to={to}
        className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
          active ? 'bg-white/20 text-white' : 'text-green-100 hover:text-white hover:bg-white/10'
        }`}
      >
        {label}
      </Link>
    );
  };

  const initial = profile?.username?.[0]?.toUpperCase() ?? '?';

  return (
    <nav className="bg-green-800 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-white text-base shrink-0">
          <span className="text-xl">📖</span>
          <span className="hidden sm:block">Bible Reading</span>
        </Link>

        <div className="flex items-center gap-1">
          {navLink('/reading/today', 'Today')}
          {navLink('/progress', 'Progress')}
          {isAdmin && navLink('/admin', 'Admin')}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold">
              {initial}
            </div>
            <span className="text-green-100 text-sm hidden sm:block">{profile?.username}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs text-green-200 hover:text-white border border-green-600 hover:border-green-400 px-3 py-1.5 rounded-md transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
