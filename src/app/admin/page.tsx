'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Ticket, 
  DollarSign, 
  Users, 
  Download, 
  PlusCircle, 
  Printer, 
  ArrowLeft, 
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { WIFI_PACKAGES } from '@/lib/packages';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Batch Generation Form State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genPackageId, setGenPackageId] = useState(WIFI_PACKAGES[1].id); // 3 Hours default
  const [genQuantity, setGenQuantity] = useState(20);
  const [genAgentName, setGenAgentName] = useState('Duka la Mangi - Kariakoo');
  const [genCommission, setGenCommission] = useState(10);
  const [genLoading, setGenLoading] = useState(false);
  const [genSuccess, setGenSuccess] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [resStats, resVouchers] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/vouchers'),
      ]);
      const dataStats = await resStats.json();
      const dataVouchers = await resVouchers.json();

      if (dataStats.success) setStats(dataStats.stats);
      if (dataVouchers.success) setVouchers(dataVouchers.vouchers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleGenerateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenLoading(true);
    setGenSuccess(null);

    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: genPackageId,
          quantity: genQuantity,
          agentName: genAgentName,
          agentCommissionPercent: genCommission,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setGenSuccess(json.message);
        setShowGenModal(false);
        fetchDashboardData();
      }
    } catch (e: any) {
      alert(e.message || 'Generation failed');
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Brand */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Captive Portal
            </Link>
            <Link
              href="/diagnostics"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-200"
            >
              MikroTik Router
            </Link>
            <Link
              href="/admin/vouchers/print"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              Print Thermal Tickets
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/admin/tcra-export"
              target="_blank"
              download
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              TCRA Audit CSV Export
            </a>
            <button
              onClick={fetchDashboardData}
              className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-emerald-200 shadow-md">
              <LayoutDashboard className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                MtaaWiFi Business & POS Control Center
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  TZS Live
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Usimamizi wa Mapato ya Simu (M-Pesa, Tigo, Airtel), Vocha za Mawakala, na Watumiaji
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowGenModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Tengeneza Vocha Mpya (Batch)
          </button>
        </div>

        {genSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{genSuccess}</span>
          </div>
        )}

        {/* 4 Financial & Operational Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Revenue */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Jumla ya Mapato</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              TZS {(stats?.totalRevenueTzs || 0).toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3 h-3" />
              Mobile Money + Vocha zilizouzwa
            </span>
          </div>

          {/* Card 2: Mobile Money Collections */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Malipo ya Simu (MoMo)</span>
              <Smartphone className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              TZS {(stats?.mobileMoneyRevenueTzs || 0).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Miamala {stats?.successfulTxCount || 0} iliyokamilika
            </span>
          </div>

          {/* Card 3: Physical Vouchers Inventory */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Hali ya Vocha (Tickets)</span>
              <Ticket className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {stats?.unusedVouchersCount || 0}
              </span>
              <span className="text-xs text-slate-500">
                bado zipo / {stats?.redeemedVouchersCount || 0} zimetumika
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Thamani iliyotumika: TZS {(stats?.voucherRevenueTzs || 0).toLocaleString()}
            </span>
          </div>

          {/* Card 4: Active Hotspot Sessions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Watumiaji Hewani</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {stats?.activeSessionsCount || 0}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Vifaa vilivyounganishwa kwenye Router
            </span>
          </div>
        </div>

        {/* Telecom Distribution Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-600" />
              Mgawanyo wa Malipo ya Mitandao ya Simu Tanzania
            </h2>
            <span className="text-xs text-slate-400">AzamPay / Selcom Settlement</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'VODACOM', name: 'Vodacom M-Pesa', bg: 'bg-red-50 text-red-700 border-red-200' },
              { key: 'TIGO', name: 'Tigo Pesa', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
              { key: 'AIRTEL', name: 'Airtel Money', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
              { key: 'HALOTEL', name: 'Halopesa', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
            ].map((telco) => {
              const data = stats?.telcoBreakdown?.[telco.key] || { count: 0, volumeTzs: 0 };
              return (
                <div key={telco.key} className={`p-4 rounded-2xl border ${telco.bg}`}>
                  <span className="text-xs font-bold block mb-1">{telco.name}</span>
                  <div className="text-base font-black">
                    TZS {data.volumeTzs.toLocaleString()}
                  </div>
                  <span className="text-[11px] opacity-80 block mt-0.5">
                    {data.count} miamala
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vouchers Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-600" />
                Orodha ya Vocha Zilizotengenezwa (Voucher Inventory)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Zinazotumika kwenye vibanda na maduka ya mangi
              </p>
            </div>
            <Link
              href="/admin/vouchers/print"
              className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Tickets Sheet
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nambari ya Vocha (Code)</th>
                  <th className="py-3 px-4 font-semibold">Kifurushi (Package)</th>
                  <th className="py-3 px-4 font-semibold">Bei (TZS)</th>
                  <th className="py-3 px-4 font-semibold">Hali (Status)</th>
                  <th className="py-3 px-4 font-semibold">Tarehe ya Kutengenezwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {vouchers.length > 0 ? (
                  vouchers.slice(0, 15).map((v: any) => (
                    <tr key={v.code} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 tracking-wider">
                        {v.code}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-700">{v.packageName}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        TZS {v.priceTzs?.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            v.status === 'UNUSED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-sans text-[11px]">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-sans text-xs">
                      Hakuna vocha zilizotengenezwa bado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Batch Generation Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Tengeneza Vocha Mpya (Batch Generator)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Unda vocha nyingi kwa wakati mmoja kwa ajili ya mawakala au maduka.
            </p>

            <form onSubmit={handleGenerateBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chagua Kifurushi</label>
                <select
                  value={genPackageId}
                  onChange={(e) => setGenPackageId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium"
                >
                  {WIFI_PACKAGES.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.nameSw} - TZS {pkg.priceTzs.toLocaleString()} ({pkg.durationLabelSw})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Idadi ya Vocha (Quantity)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={genQuantity}
                  onChange={(e) => setGenQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jina la Wakala / Duka (Kiosk Name)
                </label>
                <input
                  type="text"
                  value={genAgentName}
                  onChange={(e) => setGenAgentName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kamisheni ya Wakala (% Commission Margin)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={genCommission}
                  onChange={(e) => setGenCommission(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mfano 10%: Vocha ya 1,000 TZS unamuuzia wakala kwa 900 TZS. Yeye anapata 100 TZS faida.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowGenModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Ghairi (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={genLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {genLoading ? 'Inatengeneza...' : 'Tengeneza Vocha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
