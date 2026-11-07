'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Router, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Users, 
  ArrowLeft,
  Trash2,
  Activity,
  Server
} from 'lucide-react';

export default function DiagnosticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mikrotik/status');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSyncAll = async () => {
    setActionLoading('sync');
    setActionMessage(null);
    try {
      const res = await fetch('/api/mikrotik/sync', { method: 'POST' });
      const json = await res.json();
      setActionMessage(json.message);
      fetchStatus();
    } catch (err: any) {
      setActionMessage('Failed to sync: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleKick = async (identifier: string) => {
    setActionLoading('kick_' + identifier);
    try {
      const res = await fetch('/api/mikrotik/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const json = await res.json();
      setActionMessage(json.message);
      fetchStatus();
    } catch (err: any) {
      setActionMessage('Failed to kick user: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl shadow-sm border border-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Rudi kwenye Captive Portal
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              MikroTik RouterOS v7 Gateway
            </span>
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center border border-indigo-100">
              <Router className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                MikroTik Hotspot Gateway Diagnostics
              </h1>
              <p className="text-xs text-slate-500">
                Usimamizi wa Router, Walled Garden, Bandwidth Queues na Active Users
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 border border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleSyncAll}
              disabled={actionLoading === 'sync'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              {actionLoading === 'sync' ? 'Inasawazisha...' : 'Sync Profiles & Walled Garden'}
            </button>
          </div>
        </div>

        {/* Notification Alert */}
        {actionMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Connection */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Router Connection</span>
              <Server className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-2">
              {data?.connection?.connected ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-base font-bold text-slate-900">Online & Ready</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-base font-bold text-slate-900">Connecting...</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              {data?.connection?.message || 'Inatafuta mawasiliano...'}
            </p>
          </div>

          {/* Card 2: Driver Mode */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Active Driver</span>
              <Activity className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 font-mono">
                {data?.driver || 'MikrotikDriver'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              RouterOS v7 REST API & QoS Queue Profiles
            </p>
          </div>

          {/* Card 3: Active Sessions */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">Active Hotspot Users</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">
                {data?.activeSessionsCount || 0}
              </span>
              <span className="text-xs text-slate-500">connected devices</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Live bandwidth shaping enabled (PCQ)
            </p>
          </div>
        </div>

        {/* Active Hotspot Sessions Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Watumiaji Waliounganishwa Sasa (Live Active Hotspot Sessions)
            </h2>
            <span className="text-xs text-slate-400">MikroTik /ip/hotspot/active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">User / Phone</th>
                  <th className="py-3 px-4 font-semibold">IP Address</th>
                  <th className="py-3 px-4 font-semibold">MAC Address</th>
                  <th className="py-3 px-4 font-semibold">Uptime</th>
                  <th className="py-3 px-4 font-semibold">Bytes In / Out</th>
                  <th className="py-3 px-4 font-semibold text-right">Hatua (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {data?.activeSessions?.length > 0 ? (
                  data.activeSessions.map((session: any) => (
                    <tr key={session['.id']} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{session.user}</td>
                      <td className="py-3.5 px-4 text-slate-600">{session.address}</td>
                      <td className="py-3.5 px-4 text-slate-500">{session['mac-address']}</td>
                      <td className="py-3.5 px-4 text-slate-700">{session.uptime}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {(session['bytes-in'] / (1024 * 1024)).toFixed(1)} MB / {(session['bytes-out'] / (1024 * 1024)).toFixed(1)} MB
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleKick(session.user)}
                          disabled={actionLoading === 'kick_' + session.user}
                          className="text-red-600 hover:text-red-800 font-sans font-bold text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition"
                        >
                          Kick
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                      Hakuna kifaa kilichounganishwa kwa sasa kwenye MikroTik Hotspot.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
