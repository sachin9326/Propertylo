import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, IndianRupee, Home, Percent, Calculator, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const ROICalculator = () => {
  const [purchasePrice, setPurchasePrice] = useState(5000000);
  const [downPayment, setDownPayment] = useState(20);
  const [loanInterest, setLoanInterest] = useState(8.5);
  const [loanTenure, setLoanTenure] = useState(20);
  const [monthlyRent, setMonthlyRent] = useState(20000);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [maintenanceCost, setMaintenanceCost] = useState(3000);
  const [propertyTax, setPropertyTax] = useState(5000);
  const [appreciation, setAppreciation] = useState(5);

  const roi = useMemo(() => {
    const downPaymentAmt = purchasePrice * (downPayment / 100);
    const loanAmount = purchasePrice - downPaymentAmt;
    const r = loanInterest / 12 / 100;
    const n = loanTenure * 12;
    const emi = r > 0 ? (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : loanAmount / n;

    const effectiveRent = monthlyRent * (1 - vacancyRate / 100);
    const monthlyExpenses = emi + maintenanceCost + (propertyTax / 12);
    const monthlyCashflow = effectiveRent - monthlyExpenses;
    const annualCashflow = monthlyCashflow * 12;

    const grossAnnualRent = monthlyRent * 12;
    const netAnnualRent = effectiveRent * 12 - (maintenanceCost * 12) - propertyTax;
    const grossYield = (grossAnnualRent / purchasePrice) * 100;
    const netYield = (netAnnualRent / purchasePrice) * 100;
    const capRate = (netAnnualRent / purchasePrice) * 100;

    const breakEvenRent = monthlyExpenses / (1 - vacancyRate / 100);
    const paybackYears = downPaymentAmt > 0 ? downPaymentAmt / Math.max(annualCashflow, 1) : 0;

    // 10-year projection
    const projection = [];
    let cumulativeCashflow = -downPaymentAmt;
    for (let year = 1; year <= 10; year++) {
      const projectedValue = purchasePrice * Math.pow(1 + appreciation / 100, year);
      const projectedRent = monthlyRent * Math.pow(1.05, year - 1) * 12 * (1 - vacancyRate / 100);
      const annualExpenses = (maintenanceCost * 12 + propertyTax) * Math.pow(1.03, year - 1);
      const yearCashflow = projectedRent - annualExpenses - (emi * 12);
      cumulativeCashflow += yearCashflow;

      projection.push({
        year: `Yr ${year}`,
        propertyValue: Math.round(projectedValue / 100000),
        cashflow: Math.round(yearCashflow / 1000),
        cumulative: Math.round(cumulativeCashflow / 1000),
      });
    }

    return {
      downPaymentAmt: Math.round(downPaymentAmt),
      loanAmount: Math.round(loanAmount),
      emi: Math.round(emi),
      effectiveRent: Math.round(effectiveRent),
      monthlyExpenses: Math.round(monthlyExpenses),
      monthlyCashflow: Math.round(monthlyCashflow),
      annualCashflow: Math.round(annualCashflow),
      grossYield: grossYield.toFixed(2),
      netYield: netYield.toFixed(2),
      capRate: capRate.toFixed(2),
      breakEvenRent: Math.round(breakEvenRent),
      paybackYears: Math.max(0, paybackYears).toFixed(1),
      projection,
    };
  }, [purchasePrice, downPayment, loanInterest, loanTenure, monthlyRent, vacancyRate, maintenanceCost, propertyTax, appreciation]);

  const formatCurrency = (val) => {
    if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const expensePieData = [
    { name: 'EMI', value: roi.emi, color: '#3b82f6' },
    { name: 'Maintenance', value: maintenanceCost, color: '#f97316' },
    { name: 'Property Tax', value: Math.round(propertyTax / 12), color: '#ef4444' },
  ];

  const InputField = ({ label, value, setValue, unit, min, max, step }) => (
    <div>
      <label className="text-xs text-slate-500 mb-1 block font-medium">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          onChange={e => setValue(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
        {unit && <span className="text-xs text-slate-400 whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  );

  const StatCard = ({ label, value, sub, positive }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <div className="flex items-center gap-1 mt-1">
        {positive !== undefined && (
          positive ? <ArrowUpRight size={16} className="text-emerald-500" /> : <ArrowDownRight size={16} className="text-red-500" />
        )}
        <p className={`text-lg font-bold ${positive === false ? 'text-red-500' : positive === true ? 'text-emerald-600' : 'text-slate-800'}`}>{value}</p>
      </div>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold">ROI Calculator</h1>
              <p className="text-emerald-200 mt-1">Analyze rental investment returns</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Inputs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Investment Details</h3>
          <InputField label="Purchase Price (₹)" value={purchasePrice} setValue={setPurchasePrice} step={100000} />
          <InputField label="Down Payment" value={downPayment} setValue={setDownPayment} unit="%" min={0} max={100} />
          <InputField label="Loan Interest" value={loanInterest} setValue={setLoanInterest} unit="% p.a." step={0.1} />
          <InputField label="Loan Tenure" value={loanTenure} setValue={setLoanTenure} unit="years" min={1} max={30} />
          <hr className="border-slate-100" />
          <h3 className="text-md font-bold text-slate-800">Rental Income</h3>
          <InputField label="Expected Monthly Rent (₹)" value={monthlyRent} setValue={setMonthlyRent} step={1000} />
          <InputField label="Vacancy Rate" value={vacancyRate} setValue={setVacancyRate} unit="%" min={0} max={50} />
          <InputField label="Monthly Maintenance (₹)" value={maintenanceCost} setValue={setMaintenanceCost} step={500} />
          <InputField label="Annual Property Tax (₹)" value={propertyTax} setValue={setPropertyTax} step={1000} />
          <InputField label="Expected Appreciation" value={appreciation} setValue={setAppreciation} unit="% p.a." step={0.5} />
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Monthly Cashflow" value={formatCurrency(roi.monthlyCashflow)} positive={roi.monthlyCashflow > 0} />
            <StatCard label="Gross Yield" value={`${roi.grossYield}%`} positive={parseFloat(roi.grossYield) > 4} />
            <StatCard label="Cap Rate" value={`${roi.capRate}%`} positive={parseFloat(roi.capRate) > 3} />
            <StatCard label="Payback Period" value={`${roi.paybackYears} yrs`} sub={roi.paybackYears > 0 ? 'to recover down payment' : 'N/A'} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Monthly EMI" value={formatCurrency(roi.emi)} />
            <StatCard label="Effective Rent" value={formatCurrency(roi.effectiveRent)} sub={`after ${vacancyRate}% vacancy`} />
            <StatCard label="Breakeven Rent" value={formatCurrency(roi.breakEvenRent)} sub="to cover all expenses" />
            <StatCard label="Net Yield" value={`${roi.netYield}%`} positive={parseFloat(roi.netYield) > 2} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 10-Year Projection Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4">10-Year Cashflow Projection (₹K)</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={roi.projection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `₹${v}K`} />
                  <Bar dataKey="cashflow" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Annual Cashflow" />
                  <Bar dataKey="cumulative" fill="#10b981" radius={[4, 4, 0, 0]} name="Cumulative" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Expense Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-4">Monthly Expense Breakdown</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                    {expensePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {expensePieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs font-medium">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name}: {formatCurrency(d.value)}
                  </div>
                ))}
              </div>

              {/* Investment Rating */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-1">Investment Rating</p>
                <div className="flex items-center gap-2">
                  {parseFloat(roi.capRate) >= 4 ? (
                    <><span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full">🟢 Excellent</span><span className="text-xs text-slate-500">Strong rental returns</span></>
                  ) : parseFloat(roi.capRate) >= 2 ? (
                    <><span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-full">🟡 Average</span><span className="text-xs text-slate-500">Moderate returns</span></>
                  ) : (
                    <><span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-bold rounded-full">🔴 Risky</span><span className="text-xs text-slate-500">Low rental yield</span></>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROICalculator;
