import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

const DataUpdates = () => {
  const [activeTab, setActiveTab] = useState('indicators');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const queryClient = useQueryClient();

  // Indicator form
  const [indicatorData, setIndicatorData] = useState({
    currency: 'USD',
    indicator: 'GDP',
    actual: '',
    forecast: '',
    date: new Date().toISOString().split('T')[0],
    previous: '',
  });

  // COT form
  const [cotData, setCotData] = useState({
    asset: 'EUR',
    class: 'forex',
    date: new Date().toISOString().split('T')[0],
    long_pos: 0,
    short_pos: 0,
  });

  // Bond yield form
  const [bondData, setBondData] = useState({
    currency: 'USD',
    score: 0,
  });

  // Economic strength form
  const [strengthData, setStrengthData] = useState({
    currency: 'USD',
    gdp_growth: 0,
    unemployment_rate: 0,
    interest_rate: 0,
    cpi_yoy: 0,
  });

  // Mutations
  const updateIndicator = useMutation({
    mutationFn: (data) => api.put(`/admin/indicators/${data.currency}/${data.indicator}/`, data),
    onSuccess: () => {
      alert('Indicator updated successfully');
      queryClient.invalidateQueries(['economicHeatmap']);
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const updateCOT = useMutation({
    mutationFn: (data) => api.post('/admin/cot/', data),
    onSuccess: () => {
      alert('COT record updated successfully');
      queryClient.invalidateQueries(['cotLatest', 'cotHistory']);
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const updateBond = useMutation({
    mutationFn: (data) => api.put(`/admin/bond-yield/${data.currency}/`, { score: data.score }),
    onSuccess: () => {
      alert('Bond yield score updated successfully');
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  const updateStrength = useMutation({
    mutationFn: (data) => api.put(`/admin/economic-strength/${data.currency}/`, data),
    onSuccess: () => {
      alert('Economic strength updated successfully');
      queryClient.invalidateQueries(['economicStrength']);
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });
  const refreshPutCall = useMutation({
    mutationFn: () => api.post('/admin/refresh-put-call/'),
    onMutate: () => setIsRefreshing(true),
    onSettled: () => setIsRefreshing(false),
    onSuccess: (response) => {
      const results = response.data.results;
      const successCount = Object.values(results).filter(v => v !== 'failed').length;
      alert(`Put-Call ratios refreshed: ${successCount} successful, ${Object.keys(results).length - successCount} failed`);
      queryClient.invalidateQueries(['putCallRatio']);
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });

  // Clear Cache and Reload All
  const clearCacheAndReload = useMutation({
    mutationFn: () => api.post('/admin/clear-cache/'),
    onMutate: () => setIsClearingCache(true),
    onSettled: () => setIsClearingCache(false),
    onSuccess: () => {
      alert('Cache cleared and all data reloaded successfully');
      queryClient.invalidateQueries();
    },
    onError: (error) => alert(`Error: ${error.response?.data?.error || error.message}`),
  });


  const handleIndicatorSubmit = (e) => {
    e.preventDefault();
    updateIndicator.mutate(indicatorData);
  };

  const handleCOTSubmit = (e) => {
    e.preventDefault();
    updateCOT.mutate(cotData);
  };

  const handleBondSubmit = (e) => {
    e.preventDefault();
    updateBond.mutate(bondData);
  };

  const handleStrengthSubmit = (e) => {
    e.preventDefault();
    updateStrength.mutate(strengthData);
  };
  const [isRefreshingSeasonality, setIsRefreshingSeasonality] = useState(false);
  const [seasonalityResult, setSeasonalityResult] = useState('');
  
  const handleRefreshSeasonality = async () => {
    setIsRefreshingSeasonality(true);
    setSeasonalityResult('');
    try {
      const response = await api.post('/admin/refresh-seasonality/');
      const { message, details } = response.data;
      setSeasonalityResult(
        `✅ ${message}\n` +
        `Processed: ${details.processed} pairs\n` +
        `Failed: ${details.failed} pairs\n` +
        `Monthly records: ${details.monthly_records}\n` +
        `Annual records: ${details.annual_records}\n` +
        (details.errors.length > 0 ? `Errors: ${details.errors.join('\n')}` : '')
      );
    } catch (err) {
      setSeasonalityResult(`❌ Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setIsRefreshingSeasonality(false);
    }
  };
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">✏️ Data Updates</h2>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setActiveTab('indicators')} className={`px-4 py-2 rounded ${activeTab === 'indicators' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'}`}>
          Indicators
        </button>
        <button onClick={() => setActiveTab('cot')} className={`px-4 py-2 rounded ${activeTab === 'cot' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'}`}>
          COT Data
        </button>
        <button onClick={() => setActiveTab('bond')} className={`px-4 py-2 rounded ${activeTab === 'bond' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'}`}>
          Bond Yield
        </button>
        <button onClick={() => setActiveTab('strength')} className={`px-4 py-2 rounded ${activeTab === 'strength' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'}`}>
          Economic Strength
        </button>
        <button onClick={() => setActiveTab('putcall')} className={`px-4 py-2 rounded ${activeTab === 'putcall' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'}`}>
          Put-Call Ratio
        </button>
        <button onClick={() => setActiveTab('cache')} className={`px-4 py-2 rounded ${activeTab === 'cache' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'}`}>
          Cache
        </button>
        <button onClick={() => setActiveTab('seasonality')} className={`px-4 py-2 rounded ${activeTab === 'seasonality' ? 'bg-dark-300 text-white' : 'bg-dark-200 text-gray-400'}`}>
          Seasonality
        </button>
      </div>

      <div className="bg-dark-200 p-6 rounded-lg border border-dark-300">
        {/* Indicators Tab */}
        {activeTab === 'indicators' && (
          <form onSubmit={handleIndicatorSubmit}>
            <h3 className="text-lg font-semibold mb-4">Update Economic Indicator</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Currency</label>
                <select
                  value={indicatorData.currency}
                  onChange={(e) => setIndicatorData({ ...indicatorData, currency: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="AUD">AUD</option>
                  <option value="CAD">CAD</option>
                  <option value="CHF">CHF</option>
                  <option value="NZD">NZD</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Indicator</label>
                <input
                  type="text"
                  value={indicatorData.indicator}
                  onChange={(e) => setIndicatorData({ ...indicatorData, indicator: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                  placeholder="e.g., GDP, CPI YoY"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Actual</label>
                <input
                  type="number"
                  step="any"
                  value={indicatorData.actual}
                  onChange={(e) => setIndicatorData({ ...indicatorData, actual: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Forecast</label>
                <input
                  type="number"
                  step="any"
                  value={indicatorData.forecast}
                  onChange={(e) => setIndicatorData({ ...indicatorData, forecast: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={indicatorData.date}
                  onChange={(e) => setIndicatorData({ ...indicatorData, date: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Previous (optional)</label>
                <input
                  type="number"
                  step="any"
                  value={indicatorData.previous}
                  onChange={(e) => setIndicatorData({ ...indicatorData, previous: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
              disabled={updateIndicator.isPending}
            >
              {updateIndicator.isPending ? 'Updating...' : 'Update Indicator'}
            </button>
          </form>
        )}

        {/* COT Tab */}
        {activeTab === 'cot' && (
          <form onSubmit={handleCOTSubmit}>
            <h3 className="text-lg font-semibold mb-4">Update COT Record</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Asset</label>
                <input
                  type="text"
                  value={cotData.asset}
                  onChange={(e) => setCotData({ ...cotData, asset: e.target.value.toUpperCase() })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                  placeholder="e.g., EUR, XAU, BTC"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Class</label>
                <select
                  value={cotData.class}
                  onChange={(e) => setCotData({ ...cotData, class: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  <option value="forex">Forex</option>
                  <option value="metal">Metal</option>
                  <option value="crypto">Crypto</option>
                  <option value="index">Index</option>
                  <option value="commodity">Commodity</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={cotData.date}
                  onChange={(e) => setCotData({ ...cotData, date: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Long Contracts</label>
                <input
                  type="number"
                  value={cotData.long_pos}
                  onChange={(e) => setCotData({ ...cotData, long_pos: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Short Contracts</label>
                <input
                  type="number"
                  value={cotData.short_pos}
                  onChange={(e) => setCotData({ ...cotData, short_pos: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
              disabled={updateCOT.isPending}
            >
              {updateCOT.isPending ? 'Updating...' : 'Update COT Record'}
            </button>
          </form>
        )}

        {/* Bond Yield Tab */}
        {activeTab === 'bond' && (
          <form onSubmit={handleBondSubmit}>
            <h3 className="text-lg font-semibold mb-4">Update 2Y Yield Score</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Currency</label>
                <select
                  value={bondData.currency}
                  onChange={(e) => setBondData({ ...bondData, currency: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="AUD">AUD</option>
                  <option value="CAD">CAD</option>
                  <option value="CHF">CHF</option>
                  <option value="NZD">NZD</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Score</label>
                <select
                  value={bondData.score}
                  onChange={(e) => setBondData({ ...bondData, score: parseInt(e.target.value) })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  <option value={1}>+1 (Bullish)</option>
                  <option value={0}>0 (Neutral)</option>
                  <option value={-1}>-1 (Bearish)</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
              disabled={updateBond.isPending}
            >
              {updateBond.isPending ? 'Updating...' : 'Update Bond Yield Score'}
            </button>
          </form>
        )}

        {/* Economic Strength Tab */}
        {activeTab === 'strength' && (
          <form onSubmit={handleStrengthSubmit}>
            <h3 className="text-lg font-semibold mb-4">Update Economic Strength</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Currency</label>
                <select
                  value={strengthData.currency}
                  onChange={(e) => setStrengthData({ ...strengthData, currency: e.target.value })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="AUD">AUD</option>
                  <option value="CAD">CAD</option>
                  <option value="CHF">CHF</option>
                  <option value="NZD">NZD</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">GDP Growth (%)</label>
                <input
                  type="number"
                  step="any"
                  value={strengthData.gdp_growth}
                  onChange={(e) => setStrengthData({ ...strengthData, gdp_growth: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Unemployment Rate (%)</label>
                <input
                  type="number"
                  step="any"
                  value={strengthData.unemployment_rate}
                  onChange={(e) => setStrengthData({ ...strengthData, unemployment_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="any"
                  value={strengthData.interest_rate}
                  onChange={(e) => setStrengthData({ ...strengthData, interest_rate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">CPI YoY (%)</label>
                <input
                  type="number"
                  step="any"
                  value={strengthData.cpi_yoy}
                  onChange={(e) => setStrengthData({ ...strengthData, cpi_yoy: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
              disabled={updateStrength.isPending}
            >
              {updateStrength.isPending ? 'Updating...' : 'Update Economic Strength'}
            </button>
          </form>
        )}

        {/* Put-Call Tab */}
        {activeTab === 'putcall' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Refresh Put-Call Ratios</h3>
            <p className="text-gray-400 mb-4">Fetch the latest put/call ratios for all tracked assets from Barchart.</p>
            <button
              onClick={() => refreshPutCall.mutate()}
              disabled={isRefreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50 flex items-center gap-2"
            >
              {isRefreshing ? (
                <>
                  <span className="animate-spin">⏳</span> Refreshing...
                </>
              ) : (
                '🔄 Refresh Put-Call Ratios'
              )}
            </button>
          </div>
        )}

        {/* Cache Tab */}
        {activeTab === 'cache' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Cache Management</h3>
            <p className="text-gray-400 mb-4">Clear the Django cache and reload all data from the database. This will force a full refresh of all pages.</p>
            <button
              onClick={() => clearCacheAndReload.mutate()}
              disabled={isClearingCache}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50 flex items-center gap-2"
            >
              {isClearingCache ? (
                <>
                  <span className="animate-spin">⏳</span> Clearing...
                </>
              ) : (
                '🗑️ Clear Cache & Reload All'
              )}
            </button>
          </div>
        )}

        {activeTab === 'seasonality' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Refresh Seasonality Data</h3>
            <p className="text-gray-400 mb-4">
              Fetch 10 years of historical data from Yahoo Finance and update the seasonality tables.
              This may take a few minutes.
            </p>
            <button
              onClick={handleRefreshSeasonality}
              disabled={isRefreshingSeasonality}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
            >
              {isRefreshingSeasonality ? '⏳ Refreshing...' : '🔄 Refresh Seasonality'}
            </button>
            {seasonalityResult && (
              <div className="mt-4 p-4 bg-dark-300 rounded">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap">{seasonalityResult}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataUpdates;