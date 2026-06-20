import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function NavBar() {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <nav className="bg-green-800 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="font-bold text-lg tracking-wide">
          📖 Bible Reading
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link to="/reading/today" className="hover:text-yellow-300 transition-colors">Today</Link>
          <Link to="/progress" className="hover:text-yellow-300 transition-colors">My Progress</Link>
          {isAdmin && (
            <Link to="/admin" className="hover:text-yellow-300 transition-colors">Admin</Link>
          )}
          <span className="text-green-300">{profile?.username}</span>
          <button
            onClick={handleSignOut}
            className="bg-green-700 hover:bg-green-600 px-3 py-1 rounded text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
