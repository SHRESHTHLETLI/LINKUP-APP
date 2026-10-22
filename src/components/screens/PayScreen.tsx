import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, 
  Wallet, 
  Send, 
  ArrowDownLeft, 
  Check, 
  AlertCircle, 
  Clock, 
  Ticket, 
  Info, 
  X, 
  CreditCard, 
  ShieldCheck,
  User
} from 'lucide-react';
import { Transaction } from '../../types';

export const PayScreen: React.FC = () => {
  const { 
    balance, 
    transactions, 
    sendMoney, 
    requestMoney, 
    redeemVoucher, 
    networkStatus, 
    goBack 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'send' | 'request' | 'voucher' | 'history'>('send');
  
  // Send Form
  const [recipient, setRecipient] = useState('');
  const [address, setAddress] = useState('@elena_rostova');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  // Review & Confirmation Modal
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [pendingTxData, setPendingTxData] = useState<{ amount: number; recipient: string; address: string; note: string } | null>(null);

  // Success Confirmation Receipt Modal
  const [confirmedTx, setConfirmedTx] = useState<Transaction | null>(null);

  // Request Form
  const [reqPayer, setReqPayer] = useState('');
  const [reqAmount, setReqAmount] = useState('');
  const [reqNote, setReqNote] = useState('');
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);

  // Voucher Form
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  const [voucherFeedback, setVoucherFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  const demoRecipients = [
    { name: 'Elena Rostova', handle: '@elena_rostova' },
    { name: 'Field Outpost Alpha', handle: '@outpost_alpha' },
    { name: 'Base Supply Depot', handle: '@base_depot' },
    { name: 'Dr. David Kim', handle: '@david_kim' },
  ];

  const handleSelectDemoRecipient = (rec: { name: string; handle: string }) => {
    setRecipient(rec.name);
    setAddress(rec.handle);
  };

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSendError('Please enter a valid amount greater than $0.');
      return;
    }

    if (parsedAmount > balance) {
      setSendError(`Insufficient balance. Current simulated demo balance is $${balance.toFixed(2)}.`);
      return;
    }

    if (!recipient.trim()) {
      setSendError('Please enter or select a recipient.');
      return;
    }

    setPendingTxData({
      amount: parsedAmount,
      recipient: recipient.trim(),
      address: address.trim() || '@peer',
      note: note.trim(),
    });
    setIsReviewOpen(true);
  };

  const handleCommitTransfer = () => {
    if (!pendingTxData) return;
    const res = sendMoney(pendingTxData.amount, pendingTxData.recipient, pendingTxData.address, pendingTxData.note);
    setIsReviewOpen(false);

    if (res.success) {
      setConfirmedTx({
        id: 'tx-conf-' + Date.now(),
        type: 'send',
        amount: pendingTxData.amount,
        recipientOrSender: pendingTxData.recipient,
        recipientAddress: pendingTxData.address,
        timestamp: 'Just now',
        status: networkStatus === 'offline' ? 'queued_offline' : 'completed',
        note: pendingTxData.note,
      });
      setAmount('');
      setRecipient('');
      setNote('');
      setPendingTxData(null);
    } else {
      setSendError(res.error || 'Transfer failed.');
    }
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(reqAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !reqPayer.trim()) return;

    requestMoney(parsedAmount, reqPayer, reqNote);
    setRequestFeedback(`Simulated demo invoice for $${parsedAmount.toFixed(2)} recorded for ${reqPayer}.`);
    setReqAmount('');
    setReqPayer('');
    setReqNote('');
    setTimeout(() => {
      setActiveTab('history');
      setRequestFeedback(null);
    }, 1800);
  };

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherFeedback(null);
    const res = redeemVoucher(voucherCodeInput);
    if (res.success) {
      setVoucherFeedback({
        success: true,
        msg: `Demo voucher redeemed! $${res.amount?.toFixed(2)} added to your fictional balance.`,
      });
      setVoucherCodeInput('');
    } else {
      setVoucherFeedback({
        success: false,
        msg: res.error || 'Voucher code is invalid or already consumed.',
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-16 sm:pb-8">
      {/* 1. Header with Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">LINKUP Pay</h1>
            <p className="text-xs text-slate-400">Simulated digital wallet with offline token vouchers and peer ledger</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'send' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Send
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'request' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Request
          </button>
          <button
            onClick={() => setActiveTab('voucher')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'voucher' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vouchers
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'history' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            History ({transactions.length})
          </button>
        </div>
      </div>

      {/* 2. Short Module Explanation & Demonstration Notice */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-300 font-semibold">
          <Info className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>About LINKUP Pay</span>
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-full ml-auto font-bold tracking-wide">
            DEMO — NOT A REAL PAYMENT
          </span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
          LINKUP Pay models localized peer-to-peer digital transactions and offline token vouchers without requiring banking servers or credit card processors. All balances, recipients, and transfers are purely fictional demonstrations.
        </p>
      </div>

      {/* Wallet Balance Hero Card */}
      <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-400">
            <span>Fictional Demo Balance</span>
            <span>·</span>
            <span className="text-emerald-400 font-semibold">Local Wallet</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white mt-1">
            ${balance.toFixed(2)} <span className="text-sm font-normal text-slate-400">USD Demo</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
            <span>Your Local Demo Identifier:</span>
            <code className="text-[11px] font-mono text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              @alex_vance
            </code>
          </div>
        </div>

        {/* Quick Voucher Promo Pill */}
        <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800/80 flex flex-col justify-between max-w-xs text-xs space-y-2">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold">
            <Ticket className="w-4 h-4 text-cyan-400" />
            <span>Offline Bearer Vouchers</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Generate and redeem offline voucher tokens for hand-to-hand transactions without network connectivity.
          </p>
          <button
            onClick={() => setActiveTab('voucher')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium text-left pt-1"
          >
            Test Vouchers →
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'send' && (
        <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl mx-auto">
          <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Send Simulated Payment</h2>
              <p className="text-xs text-slate-400">Transfer demo units to contacts or outpost accounts</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded">
              Demo Transaction
            </span>
          </div>

          <form onSubmit={handleOpenReview} className="space-y-4">
            {sendError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{sendError}</span>
              </div>
            )}

            {/* Quick Demo Recipients */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Quick Select Sample Recipient
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {demoRecipients.map((rec) => (
                  <button
                    key={rec.handle}
                    type="button"
                    onClick={() => handleSelectDemoRecipient(rec)}
                    className={`p-2 rounded-xl text-left border text-xs transition-colors ${
                      recipient === rec.name
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                        : 'bg-[#080d1a] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-medium truncate">{rec.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{rec.handle}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Amount (USD Demo)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={balance}
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-base font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Available: ${balance.toFixed(2)} USD Demo</span>
                <button
                  type="button"
                  onClick={() => setAmount(balance.toString())}
                  className="text-cyan-400 hover:underline"
                >
                  Use Max
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Rostova"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Peer Handle
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="@handle"
                  className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Transaction Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Field supplies, water filter stipend"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {networkStatus === 'offline' && (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Offline: Payment will be signed locally and queued on your local ledger.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Review Simulated Payment</span>
            </button>
          </form>
        </div>
      )}

      {activeTab === 'request' && (
        <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl mx-auto">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-semibold text-white">Create Payment Request</h2>
            <p className="text-xs text-slate-400">Generate a simulated invoice for a local contact</p>
          </div>

          {requestFeedback && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{requestFeedback}</span>
            </div>
          )}

          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Requested Amount ($ USD Demo)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="50.00"
                value={reqAmount}
                onChange={(e) => setReqAmount(e.target.value)}
                className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-base font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Recipient Contact
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Field Command Central"
                value={reqPayer}
                onChange={(e) => setReqPayer(e.target.value)}
                className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Reason / Note
              </label>
              <input
                type="text"
                placeholder="Fuel reimbursement, equipment battery recharge"
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
                className="w-full bg-[#080d1a] border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Save Simulated Request</span>
            </button>
          </form>
        </div>
      )}

      {activeTab === 'voucher' && (
        <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl mx-auto">
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-semibold text-white">Offline Bearer Vouchers</h2>
            <p className="text-xs text-slate-400">Redeem demonstration vouchers to credit your fictional balance</p>
          </div>

          <form onSubmit={handleVoucherSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Enter Demo Voucher Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. VCH-EMERGENCY-50"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value)}
                  className="flex-1 bg-[#080d1a] border border-slate-800 rounded-xl px-4 py-2 text-sm font-mono uppercase text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl"
                >
                  Redeem
                </button>
              </div>
            </div>

            {voucherFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  voucherFeedback.success
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                {voucherFeedback.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                <span>{voucherFeedback.msg}</span>
              </div>
            )}
          </form>

          <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-slate-300">Quick Test Demo Code</div>
            <p className="text-slate-400 text-[11px]">
              Click below to fill a sample offline token voucher and test crediting your demo wallet:
            </p>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-cyan-300">
              <span>VCH-EMERGENCY-50</span>
              <button
                type="button"
                onClick={() => setVoucherCodeInput('VCH-EMERGENCY-50')}
                className="text-xs text-slate-300 hover:text-white px-2 py-1 bg-slate-800 rounded"
              >
                Insert Code
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-[#0e172a] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Transaction History ({transactions.length})</h2>
              <p className="text-xs text-slate-400">Locally saved simulated ledger entries</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Demo Records</span>
          </div>

          <div className="space-y-2.5">
            {transactions.map((tx) => {
              const isSend = tx.type === 'send';
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSend ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {isSend ? <Send className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{tx.recipientOrSender}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono">{tx.recipientAddress}</span>
                        <span>·</span>
                        <span>{tx.timestamp}</span>
                      </div>
                      {tx.note && <div className="text-[11px] text-slate-500 mt-1">{tx.note}</div>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-mono font-bold text-sm ${isSend ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isSend ? '-' : '+'}${tx.amount.toFixed(2)}
                    </div>
                    <span className="text-[10px] font-mono tracking-wider">
                      {tx.status === 'completed' && <span className="text-emerald-400">Delivered</span>}
                      {tx.status === 'queued_offline' && <span className="text-amber-400">Saved Locally · Pending Sync</span>}
                      {tx.status === 'pending' && <span className="text-cyan-400">Pending Sync</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Screen / Modal before committing transfer */}
      {isReviewOpen && pendingTxData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e172a] border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Review Simulated Transfer</h3>
              <button onClick={() => setIsReviewOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 text-center font-medium">
              DEMO — NOT A REAL PAYMENT
            </div>

            <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Transfer Amount:</span>
                <span className="font-mono text-base font-bold text-white">${pendingTxData.amount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Recipient:</span>
                <span className="text-slate-200 font-medium">{pendingTxData.recipient} ({pendingTxData.address})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Processing Fee:</span>
                <span className="text-emerald-400 font-mono">$0.00 (Off-Grid)</span>
              </div>
              {pendingTxData.note && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Memo:</span>
                  <span className="text-slate-300">{pendingTxData.note}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Clicking below will deduct ${pendingTxData.amount.toFixed(2)} from your fictional demo balance and record the transfer locally.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsReviewOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitTransfer}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Receipt Modal */}
      {confirmedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e172a] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Check className="w-5 h-5" />
                <span>Simulated Transfer Complete</span>
              </div>
              <button onClick={() => setConfirmedTx(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Transferred:</span>
                <span className="font-mono font-bold text-white">${confirmedTx.amount.toFixed(2)} USD Demo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient:</span>
                <span className="text-slate-200 font-medium">{confirmedTx.recipientOrSender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-mono text-emerald-400 uppercase">{confirmedTx.status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-400">{confirmedTx.timestamp}</span>
              </div>
            </div>

            <div className="text-[11px] text-emerald-400/80 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20 text-center font-medium">
              DEMO — NOT A REAL PAYMENT · Recorded in local browser state
            </div>

            <button
              onClick={() => setConfirmedTx(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
