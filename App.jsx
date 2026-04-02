import React, { useState, useEffect, useContext, createContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Download, Share2, LogOut, Plus, Settings, TrendingUp, Eye, EyeOff } from 'lucide-react';

// ============ SUPABASE SETUP ============
// REPLACE THESE WITH YOUR SUPABASE VALUES
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'; // e.g., https://xxxxx.supabase.co
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'; // Your anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ============ AUTH CONTEXT ============
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });
  }, []);

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error;
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// ============ LOGIN PAGE ============
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const err = isSignUp 
      ? await signUp(email, password)
      : await signIn(email, password);

    if (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-700 p-8 rounded-lg">
        <h1 className="text-3xl font-bold mb-2 text-center">bgmarif</h1>
        <p className="text-slate-400 text-center mb-6">Trading Journal</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white placeholder-slate-400"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white placeholder-slate-400"
            required
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-slate-400 hover:text-slate-200 text-sm"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};

// ============ MAIN APP ============
const TradingJournal = () => {
  const { user, signOut } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountId] = useState(null);
  const [trades, setTrades] = useState([]);
  const [view, setView] = useState('dashboard'); // dashboard, input, analysis, share
  const [loading, setLoading] = useState(true);

  // Fetch accounts
  useEffect(() => {
    if (!user) return;
    
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setAccounts(data || []);
      if (data && data.length > 0) {
        setActiveAccountId(data[0].id);
      }
      setLoading(false);
    };

    fetchAccounts();
  }, [user]);

  // Fetch trades for active account
  useEffect(() => {
    if (!activeAccountId) return;

    const fetchTrades = async () => {
      const { data } = await supabase
        .from('trades')
        .select('*')
        .eq('account_id', activeAccountId)
        .order('trade_date', { ascending: true });
      
      setTrades(data || []);
    };

    fetchTrades();
  }, [activeAccountId]);

  const activeAccount = accounts.find(a => a.id === activeAccountId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">bgmarif</h1>
            <p className="text-slate-400 text-sm">Trading Journal</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Account Switcher */}
            {accounts.length > 0 && (
              <select
                value={activeAccountId}
                onChange={(e) => setActiveAccountId(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded p-2 text-white"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={signOut}
              className="bg-red-600 hover:bg-red-700 p-2 rounded flex items-center gap-2"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex gap-4 flex-wrap">
          {['dashboard', 'input', 'analysis', 'share'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded font-semibold transition ${
                view === v
                  ? 'bg-blue-600'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : !activeAccount ? (
          <CreateAccountForm onAccountCreated={() => {}} />
        ) : view === 'dashboard' ? (
          <DashboardView account={activeAccount} trades={trades} />
        ) : view === 'input' ? (
          <TradeInputView account={activeAccount} trades={trades} onTradeAdded={() => {}} />
        ) : view === 'analysis' ? (
          <AnalysisView account={activeAccount} trades={trades} />
        ) : view === 'share' ? (
          <ShareView account={activeAccount} trades={trades} />
        ) : null}
      </div>
    </div>
  );
};

// ============ CREATE ACCOUNT FORM ============
const CreateAccountForm = ({ onAccountCreated }) => {
  const { user } = useAuth();
  const [name, setName] = useState('EURUSD Main');
  const [startBalance, setStartBalance] = useState('5000');
  const [riskPerTrade, setRiskPerTrade] = useState('50');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('accounts').insert({
      user_id: user.id,
      name,
      starting_balance: parseFloat(startBalance),
      risk_per_trade: parseFloat(riskPerTrade)
    });

    if (!error) {
      setName('');
      setStartBalance('5000');
      setRiskPerTrade('50');
      onAccountCreated();
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-700 p-6 rounded-lg max-w-md">
      <h2 className="text-xl font-bold mb-4">Create Trading Account</h2>
      <form onSubmit={handleCreate} className="space-y-4">
        <input
          type="text"
          placeholder="Account Name (e.g., EURUSD Main)"
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
          placeholder="Risk Per Trade ($)"
          value={riskPerTrade}
          onChange={(e) => setRiskPerTrade(e.target.value)}
          className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

// ============ DASHBOARD VIEW ============
const DashboardView = ({ account, trades }) => {
  const stats = useMemo(() => {
    let balance = account.starting_balance;
    let wins = 0, losses = 0, breakevens = 0;
    let totalPnL = 0;

    trades.forEach(trade => {
      const pnl = trade.result * account.risk_per_trade;
      totalPnL += pnl;
      if (trade.result > 0) wins++;
      else if (trade.result < 0) losses++;
      else breakevens++;
    });

    const finalBalance = account.starting_balance + totalPnL;
    const netPnLPercent = ((totalPnL / account.starting_balance) * 100).toFixed(2);

    return {
      finalBalance: finalBalance.toFixed(2),
      totalPnL: totalPnL.toFixed(2),
      netPnLPercent,
      wins,
      losses,
      breakevens,
      totalTrades: trades.length,
      winRate: trades.length > 0 ? (wins / trades.length * 100).toFixed(1) : '0'
    };
  }, [trades, account]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-700 p-4 rounded">
          <p className="text-slate-400 text-sm">Current Balance</p>
          <p className="text-2xl font-bold">${stats.finalBalance}</p>
        </div>
        <div className={`p-4 rounded ${stats.totalPnL >= 0 ? 'bg-green-900' : 'bg-red-900'}`}>
          <p className="text-slate-300 text-sm">Net P&L</p>
          <p className="text-2xl font-bold">${stats.totalPnL}</p>
          <p className="text-xs mt-1">{stats.netPnLPercent}%</p>
        </div>
        <div className="bg-slate-700 p-4 rounded">
          <p className="text-slate-400 text-sm">Win Rate</p>
          <p className="text-2xl font-bold">{stats.winRate}%</p>
          <p className="text-xs mt-1">{stats.wins}W / {stats.losses}L</p>
        </div>
        <div className="bg-slate-700 p-4 rounded">
          <p className="text-slate-400 text-sm">Total Trades</p>
          <p className="text-2xl font-bold">{stats.totalTrades}</p>
        </div>
      </div>

      {trades.length > 0 ? (
        <EquityCurveChart account={account} trades={trades} />
      ) : (
        <div className="bg-slate-700 p-8 rounded text-center">
          <p className="text-slate-400">No trades yet. Start by adding your first trade!</p>
        </div>
      )}
    </div>
  );
};

// ============ EQUITY CURVE CHART ============
const EquityCurveChart = ({ account, trades }) => {
  const chartData = useMemo(() => {
    let balance = account.starting_balance;
    const data = [{ trade: 'Start', balance: account.starting_balance }];

    trades.forEach((trade, idx) => {
      const pnl = trade.result * account.risk_per_trade;
      balance += pnl;
      data.push({
        trade: `T${idx + 1}`,
        balance: Math.round(balance * 100) / 100
      });
    });

    return data;
  }, [trades, account]);

  return (
    <div className="bg-slate-700 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Equity Curve</h2>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="trade" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} formatter={(value) => `$${value.toFixed(2)}`} />
          <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============ TRADE INPUT VIEW ============
const TradeInputView = ({ account, trades, onTradeAdded }) => {
  const { user } = useAuth();
  const [inputMode, setInputMode] = useState('individual'); // individual, daily, bulk
  const [result, setResult] = useState('0');
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddTrade = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('trades').insert({
      account_id: account.id,
      trade_date: tradeDate,
      trade_number: trades.length + 1,
      result: parseFloat(result),
      notes
    });

    if (!error) {
      setResult('0');
      setNotes('');
      // Refresh trades
      const { data } = await supabase.from('trades').select('*').eq('account_id', account.id).order('trade_date', { ascending: true });
      onTradeAdded();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {['individual', 'daily', 'bulk'].map(mode => (
          <button
            key={mode}
            onClick={() => setInputMode(mode)}
            className={`px-4 py-2 rounded font-semibold transition ${
              inputMode === mode ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      {inputMode === 'individual' && (
        <form onSubmit={handleAddTrade} className="bg-slate-700 p-6 rounded-lg max-w-md space-y-4">
          <input
            type="date"
            value={tradeDate}
            onChange={(e) => setTradeDate(e.target.value)}
            className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Result (% change: -1, 0, +2)"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
            required
          />
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
            rows="3"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Trade'}
          </button>
        </form>
      )}

      {inputMode === 'daily' && (
        <DailyInputForm account={account} onTradesAdded={onTradeAdded} />
      )}

      {inputMode === 'bulk' && (
        <BulkInputForm account={account} onTradesAdded={onTradeAdded} />
      )}

      {/* Recent Trades */}
      {trades.length > 0 && (
        <div className="bg-slate-700 p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Recent Trades</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {trades.slice(-10).reverse().map((trade, idx) => (
              <div key={trade.id} className="flex justify-between items-center p-3 bg-slate-600 rounded">
                <div>
                  <p className="font-bold">{trade.trade_date}</p>
                  <p className="text-sm text-slate-400">{trade.notes}</p>
                </div>
                <p className={`font-bold ${trade.result > 0 ? 'text-green-400' : trade.result < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                  {trade.result > 0 ? '+' : ''}{trade.result}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ DAILY INPUT FORM ============
const DailyInputForm = ({ account, onTradesAdded }) => {
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split('T')[0]);
  const [resultsText, setResultsText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddDailyTrades = async (e) => {
    e.preventDefault();
    setLoading(true);

    const results = resultsText.split(',').map(r => parseFloat(r.trim())).filter(r => !isNaN(r));
    
    const { error } = await supabase.from('trades').insert(
      results.map((result, idx) => ({
        account_id: account.id,
        trade_date: tradeDate,
        trade_number: idx + 1,
        result
      }))
    );

    if (!error) {
      setResultsText('');
      onTradesAdded();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleAddDailyTrades} className="bg-slate-700 p-6 rounded-lg max-w-md space-y-4">
      <input
        type="date"
        value={tradeDate}
        onChange={(e) => setTradeDate(e.target.value)}
        className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
      />
      <textarea
        placeholder="Enter all trades for this day, separated by commas&#10;e.g., -1, +2, -1, 0, +2"
        value={resultsText}
        onChange={(e) => setResultsText(e.target.value)}
        className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white"
        rows="4"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Daily Trades'}
      </button>
    </form>
  );
};

// ============ BULK INPUT FORM ============
const BulkInputForm = ({ account, onTradesAdded }) => {
  const [bulkText, setBulkText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBulkAdd = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Parse format: date: results, date: results
    const lines = bulkText.split('\n');
    const trades = [];

    lines.forEach(line => {
      const [dateStr, resultsStr] = line.split(':');
      if (!dateStr || !resultsStr) return;

      const date = dateStr.trim();
      const results = resultsStr.split(',').map(r => parseFloat(r.trim())).filter(r => !isNaN(r));

      results.forEach((result, idx) => {
        trades.push({
          account_id: account.id,
          trade_date: date,
          trade_number: idx + 1,
          result
        });
      });
    });

    if (trades.length > 0) {
      const { error } = await supabase.from('trades').insert(trades);
      if (!error) {
        setBulkText('');
        onTradesAdded();
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleBulkAdd} className="bg-slate-700 p-6 rounded-lg space-y-4">
      <textarea
        placeholder="Format: YYYY-MM-DD: -1, +2, -1, 0, +2&#10;2026-04-01: -1, +2, -1&#10;2026-04-02: 0, +2, +2"
        value={bulkText}
        onChange={(e) => setBulkText(e.target.value)}
        className="w-full p-3 bg-slate-600 rounded border border-slate-500 text-white font-mono text-sm"
        rows="8"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Bulk Trades'}
      </button>
    </form>
  );
};

// ============ ANALYSIS VIEW ============
const AnalysisView = ({ account, trades }) => {
  const [timeframe, setTimeframe] = useState('all'); // all, month, week

  const groupedTrades = useMemo(() => {
    if (timeframe === 'all') return { 'All Time': trades };

    const groups = {};
    trades.forEach(trade => {
      const date = new Date(trade.trade_date);
      let key;
      if (timeframe === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (timeframe === 'week') {
        const week = Math.ceil((date.getDate()) / 7);
        key = `Week ${week}`;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(trade);
    });
    return groups;
  }, [trades, timeframe]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {['all', 'month', 'week'].map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded font-semibold transition ${
              timeframe === tf ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            {tf.charAt(0).toUpperCase() + tf.slice(1)}
          </button>
        ))}
      </div>

      {Object.entries(groupedTrades).map(([period, periodTrades]) => (
        <PeriodAnalysis key={period} period={period} trades={periodTrades} account={account} />
      ))}
    </div>
  );
};

// ============ PERIOD ANALYSIS ============
const PeriodAnalysis = ({ period, trades, account }) => {
  const stats = useMemo(() => {
    let balance = account.starting_balance;
    let wins = 0, losses = 0, breakevens = 0;
    let totalPnL = 0;

    trades.forEach(trade => {
      const pnl = trade.result * account.risk_per_trade;
      totalPnL += pnl;
      if (trade.result > 0) wins++;
      else if (trade.result < 0) losses++;
      else breakevens++;
    });

    const finalBalance = account.starting_balance + totalPnL;
    const netPnLPercent = ((totalPnL / account.starting_balance) * 100).toFixed(2);

    return {
      finalBalance: finalBalance.toFixed(2),
      totalPnL: totalPnL.toFixed(2),
      netPnLPercent,
      wins,
      losses,
      breakevens,
      winRate: trades.length > 0 ? (wins / trades.length * 100).toFixed(1) : '0'
    };
  }, [trades, account]);

  const chartData = useMemo(() => {
    let balance = account.starting_balance;
    return trades.map((trade, idx) => {
      balance += trade.result * account.risk_per_trade;
      return { trade: `T${idx + 1}`, balance };
    });
  }, [trades, account]);

  return (
    <div className="bg-slate-700 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">{period}</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-600 p-3 rounded text-sm">
          <p className="text-slate-400">Balance</p>
          <p className="text-lg font-bold">${stats.finalBalance}</p>
        </div>
        <div className={`p-3 rounded text-sm ${stats.totalPnL >= 0 ? 'bg-green-900' : 'bg-red-900'}`}>
          <p className="text-slate-300">P&L</p>
          <p className="text-lg font-bold">${stats.totalPnL} ({stats.netPnLPercent}%)</p>
        </div>
        <div className="bg-slate-600 p-3 rounded text-sm">
          <p className="text-slate-400">Win Rate</p>
          <p className="text-lg font-bold">{stats.winRate}%</p>
        </div>
        <div className="bg-slate-600 p-3 rounded text-sm">
          <p className="text-slate-400">Trades</p>
          <p className="text-lg font-bold">{stats.wins}W / {stats.losses}L</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="trade" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b' }} formatter={(value) => `$${value.toFixed(2)}`} />
            <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

// ============ SHARE VIEW ============
const ShareView = ({ account, trades }) => {
  const [showPublic, setShowPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const stats = useMemo(() => {
    let balance = account.starting_balance;
    let wins = 0, losses = 0;
    let totalPnL = 0;

    trades.forEach(trade => {
      const pnl = trade.result * account.risk_per_trade;
      totalPnL += pnl;
      if (trade.result > 0) wins++;
      else if (trade.result < 0) losses++;
    });

    return {
      finalBalance: (account.starting_balance + totalPnL).toFixed(2),
      totalPnL: totalPnL.toFixed(2),
      netPnLPercent: ((totalPnL / account.starting_balance) * 100).toFixed(2),
      wins,
      losses,
      totalTrades: trades.length,
      winRate: trades.length > 0 ? (wins / trades.length * 100).toFixed(1) : '0'
    };
  }, [trades, account]);

  const handleExport = () => {
    const csv = [
      ['Date', 'Result %', 'P&L', 'Running Balance'],
      ...trades.map((trade, idx) => {
        let balance = account.starting_balance;
        trades.slice(0, idx + 1).forEach(t => {
          balance += t.result * account.risk_per_trade;
        });
        return [
          trade.trade_date,
          trade.result,
          (trade.result * account.risk_per_trade).toFixed(2),
          balance.toFixed(2)
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${account.name}-trades.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Download size={20} /> Export Data
        </h3>
        <button
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold transition"
        >
          Download CSV
        </button>
      </div>

      <div className="bg-slate-700 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Share2 size={20} /> Public Profile
        </h3>
        <div className="space-y-4">
          <button
            onClick={() => setShowPublic(!showPublic)}
            className="w-full bg-slate-600 hover:bg-slate-500 p-3 rounded font-semibold flex items-center justify-center gap-2 transition"
          >
            {showPublic ? <EyeOff size={20} /> : <Eye size={20} />}
            {showPublic ? 'Hide' : 'Show'} Public Profile
          </button>

          {showPublic && (
            <div className="bg-slate-600 p-4 rounded space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-400">Account</p>
                  <p className="font-bold">{account.name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Current Balance</p>
                  <p className="font-bold">${stats.finalBalance}</p>
                </div>
                <div>
                  <p className="text-slate-400">Total P&L</p>
                  <p className={`font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${stats.totalPnL} ({stats.netPnLPercent}%)
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Win Rate</p>
                  <p className="font-bold">{stats.winRate}% ({stats.wins}W/{stats.losses}L)</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">Share this link to show your trading results (public read-only view coming soon)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT WITH AUTH ============
export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  return user ? <TradingJournal /> : <LoginPage />;
}

// Helper hook
function useMemo(fn, deps) {
  return React.useMemo(fn, deps);
}
