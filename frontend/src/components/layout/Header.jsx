import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, signOut } = useAuth();
  return (
    <header className="bg-dark-200 border-b border-dark-300 p-4 flex justify-between items-center">
      <div className="text-xl font-bold">Dashboard</div>
      <div className="flex items-center gap-4">
        <span className="text-gray-400">{user?.email}</span>
        <button onClick={signOut} className="text-gray-400 hover:text-white">Logout</button>
      </div>
    </header>
  );
};

export default Header;