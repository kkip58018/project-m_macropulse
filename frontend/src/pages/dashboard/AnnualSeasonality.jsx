import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analysis } from '../../api/endpoints';
import Plot from 'react-plotly.js';

const ALL_PAIRS = [
  "AUD/CAD", "AUD/CHF", "AUD/JPY", "AUD/NZD", "AUD/USD",
  "CAD/CHF", "CAD/JPY", "CHF/JPY", "EUR/AUD", "EUR/CAD",
  "EUR/CHF", "EUR/GBP", "EUR/JPY", "EUR/NZD", "EUR/USD",
  "GBP/AUD", "GBP/CAD", "GBP/CHF", "GBP/JPY", "GBP/NZD",
  "GBP/USD", "NZD/CAD", "NZD/CHF", "NZD/JPY", "NZD/USD",
  "USD/CAD", "USD/CHF", "USD/JPY",
  "XAU/USD", "XAG/USD", "BTC/USD", "ETH/USD", "USOIL/USD", "SPX500/USD", "NAS100/USD"
];

const AnnualSeasonality = () => {
  const [pair, setPair] = useState('EUR/USD');
  const { data, isLoading, error } = useQuery({
    queryKey: ['annualSeasonality', pair],
    queryFn: () => analysis.getAnnualSeasonality(pair).then(res => res.data),
    enabled: !!pair,
  });

  if (isLoading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-400">Error loading data</div>;
  if (!data || data.length === 0) return <div className="text-gray-400">No data available</div>;

  // Data structure: [{'week': 1, 'cumulative_return': 2.3}, ...]
  const weeks = data.map(d => d.week);
  const returns = data.map(d => d.cumulative_return);

  const chartData = [
    {
      type: 'scatter',
      mode: 'lines',
      x: weeks,
      y: returns,
      name: 'Cumulative Return',
      line: { color: '#aaaaaa', width: 2.5 },
    },
  ];

  const layout = {
    title: {
      text: `Annual Seasonality – ${pair}`,
      font: { color: '#ffffff', size: 18 },
    },
    xaxis: {
      title: 'Week',
      tickvals: [1, 5, 9, 14, 18, 22, 27, 31, 36, 40, 44, 49],
      ticktext: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      gridcolor: 'rgba(128,128,128,0.1)',
    },
    yaxis: {
      title: 'Cumulative Return (%)',
      tickformat: '.2f%',
      gridcolor: 'rgba(128,128,128,0.1)',
      zerolinecolor: 'rgba(128,128,128,0.3)',
    },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { l: 50, r: 30, t: 60, b: 40 },
    height: 720,
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: '#1e2430',
      font: { color: 'white', size: 12 },
      bordercolor: '#2a3340',
    },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">📈 Annual Seasonality</h2>
        <select
          value={pair}
          onChange={(e) => setPair(e.target.value)}
          className="bg-dark-300 text-white border border-dark-400 rounded px-3 py-1"
        >
          {ALL_PAIRS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="bg-dark-200 p-4 rounded-lg border border-dark-300">
        <Plot
          data={chartData}
          layout={layout}
          config={{ displayModeBar: false }}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default AnnualSeasonality;