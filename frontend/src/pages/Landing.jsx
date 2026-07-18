import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already authenticated, redirect to dashboard
  if (user) {
    navigate('/top-setups');
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-100 text-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-dark-300 py-4 px-6 flex justify-between items-center sticky top-0 bg-dark-100 z-10">
        <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          📊 MacroPulse
        </div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-gray-400 hover:text-white transition">Features</a>
          <a href="#why-us" className="text-gray-400 hover:text-white transition">Why Us</a>
          <a href="#contact" className="text-gray-400 hover:text-white transition">Contact</a>
          <button
            onClick={() => navigate('/login')}
            className="bg-transparent border border-green-400 text-green-400 px-4 py-1.5 rounded hover:bg-green-400 hover:text-dark-100 transition"
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent leading-tight">
          Trade with <br />Institutional Clarity
        </h1>
        <p className="text-gray-400 text-lg md:text-xl mt-4 max-w-2xl">
          Stop guessing. Start trading with a data‑driven edge that combines institutional positioning, macro surprises, and seasonal patterns into one clear direction.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="mt-8 bg-gradient-to-r from-green-400 to-blue-500 text-dark-100 font-bold px-8 py-3 rounded-lg hover:opacity-90 transition text-lg"
        >
          🚀 Get Started — It's Free
        </button>
      </section>

      {/* Value Section */}
      <section id="why-us" className="py-16 px-4 border-t border-dark-300 bg-dark-200/30">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl mb-3">🏦</div>
            <h3 className="text-xl font-bold text-white">Trade What the Smart Money Sees</h3>
            <p className="text-gray-400 mt-2">COT positioning, retail sentiment, and macro surprises — the same data hedge funds use.</p>
          </div>
          <div>
            <div className="text-4xl mb-3">📈</div>
            <h3 className="text-xl font-bold text-white">Spot High‑Probability Setups Instantly</h3>
            <p className="text-gray-400 mt-2">Our scoring system surfaces the most compelling opportunities, saving you hours of analysis.</p>
          </div>
          <div>
            <div className="text-4xl mb-3">⏱️</div>
            <h3 className="text-xl font-bold text-white">From Hours to Seconds</h3>
            <p className="text-gray-400 mt-2">Stop manually checking calendars and COT reports — we do the heavy lifting for you.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 border-t border-dark-300">
        <h2 className="text-3xl font-bold text-center text-white mb-12">Everything You Need to Trade Smarter</h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="bg-dark-200 p-6 rounded-lg border border-dark-300 hover:border-green-400 transition">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold text-white">Deep‑Dive Scorecard</h3>
            <p className="text-gray-400 text-sm">Click any asset to see exactly why it scored the way it did.</p>
          </div>
          <div className="bg-dark-200 p-6 rounded-lg border border-dark-300 hover:border-green-400 transition">
            <div className="text-3xl mb-3">🌡️</div>
            <h3 className="text-lg font-semibold text-white">Currency Strength at a Glance</h3>
            <p className="text-gray-400 text-sm">Intuitive heatmap and gauges show which currencies are strong or weak.</p>
          </div>
          <div className="bg-dark-200 p-6 rounded-lg border border-dark-300 hover:border-green-400 transition">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-white">Institutional COT Tracker</h3>
            <p className="text-gray-400 text-sm">See how the "big money" is positioned and how it's changing.</p>
          </div>
          <div className="bg-dark-200 p-6 rounded-lg border border-dark-300 hover:border-green-400 transition">
            <div className="text-3xl mb-3">📆</div>
            <h3 className="text-lg font-semibold text-white">Live Economic Radar</h3>
            <p className="text-gray-400 text-sm">Plan your week around high‑impact news with real‑time updates.</p>
          </div>
          <div className="bg-dark-200 p-6 rounded-lg border border-dark-300 hover:border-green-400 transition">
            <div className="text-3xl mb-3">🍂</div>
            <h3 className="text-lg font-semibold text-white">Seasonal Edge</h3>
            <p className="text-gray-400 text-sm">Leverage historical monthly biases and recurring trend windows.</p>
          </div>
          <div className="bg-dark-200 p-6 rounded-lg border border-dark-300 hover:border-green-400 transition">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-white">Crowd Sentiment</h3>
            <p className="text-gray-400 text-sm">Contrarian signals from retail positioning and put/call ratios.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 px-4 border-t border-dark-300 bg-dark-200/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get in Touch</h2>
          <p className="text-gray-400 mb-6">Have questions? We're here to help.</p>
          <div className="bg-dark-200 p-6 rounded-lg border border-dark-300 max-w-md mx-auto text-left space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">📧</span>
              <a href="mailto:support@macropulse.io" className="text-green-400 hover:underline">support@macropulse.io</a>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <a href="#" className="text-green-400 hover:underline">Join our WhatsApp Community</a>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl">🐦</span>
              <a href="#" className="text-green-400 hover:underline">Follow @MacroPulse</a>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-4">We typically respond within 24 hours.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm border-t border-dark-300">
        <p>© 2025 MacroPulse. All rights reserved. | <a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a> | <a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></p>
        <p className="text-xs mt-1">Forex trading involves substantial risk. Past performance does not guarantee future results.</p>
      </footer>
    </div>
  );
};

export default Landing;