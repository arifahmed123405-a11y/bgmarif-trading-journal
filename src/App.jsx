import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'YOUR_URL';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY || 'YOUR_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);
  const [trades, setTrades] = useState([]);
  const [view, setView] = useState('login');
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAccounts();
  }, [user]);

  useEffect(() => {
    if (!activeAccount) return;
    fetchTrades();
  }, [activeAccount]);

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id);
    setAccounts(data || []);
    if (data && data.length > 0) {
      setActiveAccount(data[0]);
    }
  };

  const fetchTrades = async () => {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('account_id', activeAccount.id)
      .order('trade_date', { ascending: true });
    setTrades(data || []);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    const { error: err } = await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message);
    else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCreateAccount = async (name, startBalance, riskPerTrade) => {
    await supabase.from('accounts').insert({
      user_id: user.id,
      name,
      starting_balance: parseFloat(startBalance),
      risk_per_trade: parseFloat(riskPerTrade)
    });
    fetchAccounts();
  };

  const handleAddTrade = async (tradeDate, result, notes) => {
    await supabase.from('trades').insert({
      account_id: activeAccount.id,
      trade_date: tradeDate,
      trade_number: trades.length + 1,
      result: parseFloat(result),
      notes
    });
    fetchTrades();
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-700 p-8 rounded-lg">
          <h1 className="text-3xl font-bold mb-2 text-center">bgmarif</h1>
          <p className="text-slate-400 text-center mb-6">Trading Journal</p>
          
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
              required
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full mt-4 text-slate-400 text-sm"
          >
            {isSignUp ? 'Already have account? Sign In' : 'No account? Sign Up'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">bgmarif</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-600 px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {!activeAccount ? (
          <CreateAccountForm onCreate={handleCreateAccount} />
        ) : (
          <div className="space-y-6">
            <div className="flex gap-2">
              <select
                value={activeAccount.id}
                onChange={(e) => setActiveAccount(accounts.find(a => a.id === e.target.value))}
                className="bg-slate-700 border border-slate-600 rounded p-2 text-white"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              <button
                onClick={() => setView('dashboard')}
                className={`px-4 py-2 rounded ${view === 'dashboard' ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('input')}
                className={`px-4 py-2 rounded ${view === 'input' ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                Input
              </button>
            </div>

            {view === 'dashboard' && <DashboardView account={activeAccount} trades={trades} />}
            {view === 'input' && <InputView account={activeAccount} onAddTrade={handleAddTrade} />}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateAccountForm({ onCreate }) {
  const [name, setName] = useState('EURUSD Main');
  const [startBalance, setStartBalance] = useState('5000');
  const [riskPerTrade, setRiskPerTrade] = useState('50');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(name, startBalance, riskPerTrade);
    setName('');
    setStartBalance('5000');
    setRiskPerTrade('50');
  };

  return (
    <div className="bg-slate-700 p-6 rounded-lg max-w-md">
      <h2 className="text-xl font-bold mb-4">Create Trading Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Account Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
          required
        />
        <input
          type="number"
          placeholder="Starting Balance"
          value={startBalance}
          onChange={(e) => setStartBalance(e.target.value)}
          className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
          required
        />
        <input
          type="number"
          placeholder="Risk Per Trade"
          value={riskPerTrade}
          onChange={(e) => setRiskPerTrade(e.target.value)}
          className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
          required
        />
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold">
          Create Account
        </button>
      </form>
    </div>
  );
}

function DashboardView({ account, trades }) {
  const stats = {
    wins: trades.filter(t => t.result > 0).length,
    losses: trades.filter(t => t.result < 0).length,
    totalPnL: trades.reduce((sum, t) => sum + (t.result * account.risk_per_trade), 0),
  };

  const chartData = [
    { trade: 'Start', balance: account.starting_balance },
    ...trades.map((t, i) => {
      let balance = account.starting_balance;
      trades.slice(0, i + 1).forEach(tr => {
        balance += tr.result * account.risk_per_trade;
      });
      return { trade: `T${i + 1}`, balance };
    })
  ];

  const finalBalance = account.starting_balance + stats.totalPnL;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 p-4 rounded">
          <p className="text-slate-400 text-sm">Balance</p>
          <p className="text-2xl font-bold">${finalBalance.toFixed(2)}</p>
        </div>
        <div className={`p-4 rounded ${stats.totalPnL >= 0 ? 'bg-green-900' : 'bg-red-900'}`}>
          <p className="text-slate-300 text-sm">P&L</p>
          <p className="text-2xl font-bold">${stats.totalPnL.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700 p-4 rounded">
          <p className="text-slate-400 text-sm">Wins/Losses</p>
          <p className="text-2xl font-bold">{stats.wins}W / {stats.losses}L</p>
        </div>
        <div className="bg-slate-700 p-4 rounded">
          <p className="text-slate-400 text-sm">Total Trades</p>
          <p className="text-2xl font-bold">{trades.length}</p>
        </div>
      </div>

      {trades.length > 0 && (
        <div className="bg-slate-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Equity Curve</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="trade" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} contentStyle={{ backgroundColor: '#1e293b' }} />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function InputView({ account, onAddTrade }) {
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState('0');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddTrade(tradeDate, result, notes);
    setResult('0');
    setNotes('');
  };

  return (
    <div className="bg-slate-700 p-6 rounded-lg max-w-md">
      <h2 className="text-xl font-bold mb-4">Add Trade</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="date"
          value={tradeDate}
          onChange={(e) => setTradeDate(e.target.value)}
          className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
        />
        <input
          type="number"
          step="0.1"
          placeholder="Result % (-1, 0, +2)"
          value={result}
          onChange={(e) => setResult(e.target.value)}
          className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
          required
        />
        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
          rows="3"
        />
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold">
          Add Trade
        </button>
      </form>
    </div>
  );
}
