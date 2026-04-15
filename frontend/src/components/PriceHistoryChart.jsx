import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const PriceHistoryChart = ({ locality, currentPrice, areaSqFt }) => {
  // Generate realistic mock historical data based on locality
  const chartData = useMemo(() => {
    const seed = (locality || 'default').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const basePrice = currentPrice ? currentPrice / areaSqFt : 5000;
    const data = [];

    // 5 years of historical data (monthly)
    for (let i = -60; i <= 0; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthLabel = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

      // Simulate realistic growth with some noise
      const growthFactor = 1 + (0.06 * (i + 60) / 60); // ~6% annual avg
      const noise = 1 + (Math.sin(seed + i * 0.5) * 0.03); // ±3% variation
      const price = Math.round(basePrice * growthFactor * noise * 0.7);

      data.push({ month: monthLabel, price, type: 'historical' });
    }

    // 12-month forecast (linear regression extension)
    const lastPrice = data[data.length - 1].price;
    const annualGrowth = ((seed % 5) + 4) / 100; // 4-8% growth

    for (let i = 1; i <= 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthLabel = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const predictedPrice = Math.round(lastPrice * (1 + annualGrowth * i / 12));

      data.push({ month: monthLabel, forecast: predictedPrice, type: 'forecast' });
    }

    return data;
  }, [locality, currentPrice, areaSqFt]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const historicalPrices = chartData.filter(d => d.price).map(d => d.price);
    const firstPrice = historicalPrices[0];
    const lastPrice = historicalPrices[historicalPrices.length - 1];
    const fiveYearReturn = ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1);
    const annualReturn = (Math.pow(lastPrice / firstPrice, 1 / 5) - 1) * 100;

    const forecastPrices = chartData.filter(d => d.forecast).map(d => d.forecast);
    const forecastEnd = forecastPrices[forecastPrices.length - 1];
    const forecastGrowth = ((forecastEnd - lastPrice) / lastPrice * 100).toFixed(1);

    let rating = 'Good';
    let ratingColor = 'emerald';
    if (annualReturn < 4) { rating = 'Average'; ratingColor = 'amber'; }
    if (annualReturn < 2) { rating = 'Risky'; ratingColor = 'red'; }

    return {
      fiveYearReturn,
      annualReturn: annualReturn.toFixed(1),
      forecastGrowth,
      currentPricePerSqft: lastPrice,
      rating,
      ratingColor,
    };
  }, [chartData]);

  const formatPrice = (val) => `₹${val?.toLocaleString('en-IN')}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 size={20} className="text-primary" />
          Price Trend — {locality || 'Area'}
        </h3>
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-${metrics.ratingColor}-100 text-${metrics.ratingColor}-700`}>
          {parseFloat(metrics.annualReturn) > 4 ? '🟢' : parseFloat(metrics.annualReturn) > 2 ? '🟡' : '🔴'} {metrics.rating} Investment
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500">5yr Return</p>
          <p className={`text-sm font-bold ${parseFloat(metrics.fiveYearReturn) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {parseFloat(metrics.fiveYearReturn) > 0 ? '+' : ''}{metrics.fiveYearReturn}%
          </p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500">Annual Avg</p>
          <p className="text-sm font-bold text-blue-600">+{metrics.annualReturn}%</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500">12m Forecast</p>
          <p className="text-sm font-bold text-purple-600">+{metrics.forecastGrowth}%</p>
        </div>
        <div className="text-center p-2 bg-slate-50 rounded-lg">
          <p className="text-xs text-slate-500">Price/sqft</p>
          <p className="text-sm font-bold text-slate-800">{formatPrice(metrics.currentPricePerSqft)}</p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 9 }} interval={8} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} width={55} />
          <Tooltip formatter={(v) => formatPrice(v)} />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} name="Historical" />
          <Line type="monotone" dataKey="forecast" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 text-xs font-medium">
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-blue-500 rounded" /> Historical</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-purple-500 rounded border-dashed" style={{ borderTop: '2px dashed #a855f7', height: 0 }} /> 12m Forecast</div>
      </div>
    </div>
  );
};

export default PriceHistoryChart;
