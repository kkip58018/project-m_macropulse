import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { isAdmin } = useAuth();

  const links = [
    { to: '/top-setups', icon: '🏆', label: 'Top Setups' },
    { to: '/asset-scorecard', icon: '📋', label: 'Asset Scorecard' },
    { to: '/forex-scorecard', icon: '📊', label: 'Forex Scorecard' },
    { to: '/latest-cot', icon: '📉', label: 'Latest COT' },
    { to: '/cot-trends', icon: '📈', label: 'COT Trends' },
    { to: '/cot-history', icon: '📊', label: 'COT History' },
    { to: '/eco-surprise', icon: '📈', label: 'Eco Surprise' },
    { to: '/economic-strength', icon: '🌍', label: 'Economic Strength' },
    { to: '/monthly-seasonality', icon: '📅', label: 'Monthly Seasonality' },
    { to: '/annual-seasonality', icon: '📈', label: 'Annual Seasonality' },
    { to: '/economic-heatmap', icon: '🔥', label: 'Economic Heatmap' },
    { to: '/retail-sentiment', icon: '🔄', label: 'Retail Sentiment' },
    { to: '/put-call', icon: '📊', label: 'Put-Call Ratio' },
    { to: '/economic-calendar', icon: '📅', label: 'Economic Calendar' },
  ];

  const adminLinks = [
    { to: '/data-updates', icon: '✏️', label: 'Data Updates' },
    { to: '/trend-settings', icon: '⚙️', label: 'Trend Settings' },
    { to: '/user-approvals', icon: '👥', label: 'User Approvals' },
  ];

  return (
    <aside className="w-64 bg-dark-200 border-r border-dark-300 p-4 flex-shrink-0 overflow-y-auto h-screen sticky top-0">
      <div className="text-2xl font-bold text-green-400 mb-8">MacroPulse</div>
      <nav className="space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg transition ${
                isActive ? 'bg-dark-300 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-300'
              }`
            }
          >
            <span className="mr-2">{link.icon}</span>{link.label}
          </NavLink>
        ))}
        {isAdmin && (
          <>
            <div className="border-t border-dark-300 my-4"></div>
            {adminLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg transition ${
                    isActive ? 'bg-dark-300 text-white' : 'text-gray-400 hover:text-white hover:bg-dark-300'
                  }`
                }
              >
                <span className="mr-2">{link.icon}</span>{link.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;