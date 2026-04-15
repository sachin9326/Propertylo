import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, IndianRupee, Home, Percent, Calendar } from 'lucide-react';

const EMICalculator = () => {
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [monthlyIncome, setMonthlyIncome] = useState(100000);

  // EMI Calculation
  const emiData = useMemo(() => {
    const P = loanAmount;
    const r = interestRate / 12 / 100;
    const n = tenure * 12;

    if (r === 0) {
      const emi = P / n;
      return { emi, totalPayment: P, totalInterest: 0, principal: P };
    }

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    return { emi: Math.round(emi), totalPayment: Math.round(totalPayment), totalInterest: Math.round(totalInterest), principal: P };
  }, [loanAmount, interestRate, tenure]);

  // Amortization schedule for chart
  const amortizationData = useMemo(() => {
    const r = interestRate / 12 / 100;
    const n = tenure * 12;
    let balance = loanAmount;
    const data = [];

    for (let year = 1; year <= tenure; year++) {
      let yearlyPrincipal = 0;
      let yearlyInterest = 0;

      for (let month = 0; month < 12; month++) {
        if (balance <= 0) break;
        const interestPayment = balance * r;
        const principalPayment = emiData.emi - interestPayment;
        yearlyPrincipal += principalPayment;
        yearlyInterest += interestPayment;
        balance -= principalPayment;
      }

      data.push({
        year: `Year ${year}`,
        principal: Math.round(yearlyPrincipal),
        interest: Math.round(yearlyInterest),
        balance: Math.max(0, Math.round(balance)),
      });
    }
    return data;
  }, [loanAmount, interestRate, tenure, emiData.emi]);

  // Affordability
  const affordability = useMemo(() => {
    const maxEMI = monthlyIncome * 0.4; // 40% of income rule
    const r = interestRate / 12 / 100;
    const n = 20 * 12; // 20 year standard
    const maxLoan = r > 0
      ? (maxEMI * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n))
      : maxEMI * n;
    const maxProperty = maxLoan / 0.8; // 80% LTV
    return { maxEMI: Math.round(maxEMI), maxLoan: Math.round(maxLoan), maxProperty: Math.round(maxProperty) };
  }, [monthlyIncome, interestRate]);

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const pieData = [
    { name: 'Principal', value: emiData.principal, color: '#3b82f6' },
    { name: 'Interest', value: emiData.totalInterest, color: '#f97316' },
  ];

  const SliderInput = ({ label, icon: Icon, value, setValue, min, max, step, unit, format }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Icon size={16} className="text-primary" />
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={e => setValue(parseFloat(e.target.value) || 0)}
            className="w-28 px-3 py-1.5 text-right text-sm font-bold border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          {unit && <span className="text-xs text-slate-500 font-medium">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => setValue(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-slate-400">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Calculator size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">EMI Calculator</h1>
              <p className="text-blue-200 mt-1">Plan your home loan with precision</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sliders */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-800">Loan Details</h3>
          <SliderInput label="Loan Amount" icon={IndianRupee} value={loanAmount} setValue={setLoanAmount} min={100000} max={100000000} step={100000} format={formatCurrency} />
          <SliderInput label="Interest Rate" icon={Percent} value={interestRate} setValue={setInterestRate} min={5} max={20} step={0.1} unit="%" />
          <SliderInput label="Loan Tenure" icon={Calendar} value={tenure} setValue={setTenure} min={1} max={30} step={1} unit="years" />
        </div>

        {/* Center: Results */}
        <div className="lg:col-span-1 space-y-6">
          {/* EMI Card */}
          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-primary/20">
            <p className="text-blue-200 text-sm font-medium mb-1">Monthly EMI</p>
            <p className="text-4xl font-extrabold">{formatCurrency(emiData.emi)}</p>
            <p className="text-blue-200 text-xs mt-2">for {tenure} years at {interestRate}% p.a.</p>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total Payment</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{formatCurrency(emiData.totalPayment)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Total Interest</p>
              <p className="text-lg font-bold text-orange-500 mt-1">{formatCurrency(emiData.totalInterest)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Principal</p>
              <p className="text-lg font-bold text-blue-500 mt-1">{formatCurrency(emiData.principal)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs text-slate-500 font-medium">Interest Ratio</p>
              <p className="text-lg font-bold text-slate-800 mt-1">{((emiData.totalInterest / emiData.totalPayment) * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Payment Breakdown</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs font-medium">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Amortization Chart */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 mb-4">Yearly Amortization</h4>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={amortizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={Math.floor(tenure / 5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => formatCurrency(v)} width={70} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Area type="monotone" dataKey="principal" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Principal" />
                <Area type="monotone" dataKey="interest" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} name="Interest" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Affordability Check */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-emerald-800 mb-4 flex items-center gap-2">
              <Home size={16} />
              Affordability Check
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">Monthly Income (₹)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={e => setMonthlyIncome(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-emerald-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-400 outline-none"
                />
              </div>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Max EMI (40% rule)</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(affordability.maxEMI)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Max Loan Amount</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(affordability.maxLoan)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-emerald-200">
                  <span className="text-slate-700 font-semibold">You can afford up to</span>
                  <span className="font-extrabold text-emerald-800 text-lg">{formatCurrency(affordability.maxProperty)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EMICalculator;
