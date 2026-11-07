'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Wifi, 
  Smartphone, 
  Ticket, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Zap, 
  Globe2, 
  ArrowRight, 
  PhoneCall,
  Loader2,
  ShieldCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { WIFI_PACKAGES } from '@/lib/packages';
import { detectTzCarrier, normalizeTzPhone } from '@/lib/telco';
import { WifiPackage, HotspotSession } from '@/lib/types';
import swDict from '@/locales/sw.json';
import enDict from '@/locales/en.json';

export default function CaptivePortal() {
  const [lang, setLang] = useState<'sw' | 'en'>('sw');
  const [activeTab, setActiveTab] = useState<'buy' | 'voucher' | 'status'>('buy');
  
  // Selected package for payment
  const [selectedPkg, setSelectedPkg] = useState<WifiPackage | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStep, setPaymentStep] = useState<'INPUT' | 'PENDING' | 'SUCCESS' | 'FAILED'>('INPUT');
  const [paymentTxId, setPaymentTxId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Voucher redemption
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Status check
  const [statusQuery, setStatusQuery] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [statusSearched, setStatusSearched] = useState(false);

  const t = lang === 'sw' ? swDict : enDict;
  const carrier = detectTzCarrier(phoneNumber);

  // Auto poll payment status when in PENDING state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (paymentStep === 'PENDING' && paymentTxId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/status?id=${paymentTxId}`);
          const data = await res.json();
          if (data.status === 'SUCCESS') {
            setPaymentStep('SUCCESS');
            if (data.session) {
              setActiveSession(data.session);
            }
          } else if (data.status === 'FAILED') {
            setPaymentStep('FAILED');
            setPaymentError(t.payment_modal.failed_desc);
          }
        } catch (e) {
          console.error(e);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [paymentStep, paymentTxId, t]);

  const handleInitiatePayment = async () => {
    if (!selectedPkg || !phoneNumber) return;
    setPaymentStep('PENDING');
    setPaymentError(null);

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          packageId: selectedPkg.id,
          macAddress: 'BC:D1:D3:55:6A:11', // simulated client MAC
          clientIp: '192.168.88.245',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentTxId(data.transactionId);
      } else {
        setPaymentStep('FAILED');
        setPaymentError(data.message || 'Payment initiation failed');
      }
    } catch (err: any) {
      setPaymentStep('FAILED');
      setPaymentError(err.message || 'Network error');
    }
  };

  const handleRedeemVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherMessage(null);

    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode,
          macAddress: 'BC:D1:D3:55:6A:11',
          clientIp: '192.168.88.245',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVoucherMessage({ type: 'success', text: data.message });
        setActiveSession(data.session);
      } else {
        setVoucherMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setVoucherMessage({ type: 'error', text: 'Hitilafu ya mtandao. Jaribu tena.' });
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!statusQuery.trim()) return;
    setStatusLoading(true);
    setStatusSearched(true);

    try {
      const res = await fetch(`/api/hotspot/status?q=${encodeURIComponent(statusQuery)}`);
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
      } else {
        setActiveSession(null);
      }
    } catch (e) {
      setActiveSession(null);
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Banner / Navbar */}
      <header className="bg-emerald-700 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm border border-white/20">
              <Wifi className="w-6 h-6 text-emerald-200 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                {t.app_name}
                <span className="text-xs bg-emerald-500/40 text-emerald-100 px-2 py-0.5 rounded-full font-medium border border-emerald-400/30">
                  Hotspot
                </span>
              </h1>
              <p className="text-xs text-emerald-100">{t.tagline}</p>
            </div>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'sw' ? 'en' : 'sw')}
            className="flex items-center space-x-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 transition px-3 py-1.5 rounded-full border border-white/20"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>{lang === 'sw' ? '🇹🇿 Swahili' : '🇬🇧 English'}</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-4xl w-full mx-auto px-4 py-6 flex-1">
        {/* Connection Notice */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 mb-6 flex items-start gap-3">
          <div className="p-2 bg-amber-50 rounded-xl text-amber-600 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 text-sm text-slate-700">
            <span className="font-semibold text-slate-900 block">Wi-Fi Connected</span>
            {t.status_connected_no_internet}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 bg-slate-200/80 p-1.5 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition ${
              activeTab === 'buy'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            {t.tabs.buy}
          </button>
          <button
            onClick={() => setActiveTab('voucher')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition ${
              activeTab === 'voucher'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            {t.tabs.voucher}
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm transition ${
              activeTab === 'status'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            {t.tabs.status}
          </button>
        </div>

        {/* TAB 1: BUY PACKAGES */}
        {activeTab === 'buy' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900">{t.packages.title}</h2>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                M-Pesa, Tigo, Airtel, Halopesa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {WIFI_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative rounded-2xl p-5 bg-white border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                    pkg.isPopular
                      ? 'border-emerald-500 shadow-emerald-100 ring-2 ring-emerald-500/20'
                      : 'border-slate-200'
                  }`}
                >
                  {pkg.isPopular && (
                    <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      {t.packages.popular}
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-slate-900 text-base mb-1">
                      {lang === 'sw' ? pkg.nameSw : pkg.nameEn}
                    </h3>
                    <div className="flex items-baseline gap-1 my-3">
                      <span className="text-2xl font-black text-emerald-700 tracking-tight">
                        TZS {pkg.priceTzs.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        / {lang === 'sw' ? pkg.durationLabelSw : pkg.durationLabelEn}
                      </span>
                    </div>

                    <ul className="text-xs text-slate-600 space-y-2 mb-4">
                      <li className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span>{t.packages.speed} <strong>{pkg.speedLimit}</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.packages.unlimited} ({t.packages.validity}: {lang === 'sw' ? pkg.durationLabelSw : pkg.durationLabelEn})</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPkg(pkg);
                      setPaymentStep('INPUT');
                      setPhoneNumber('');
                    }}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
                      pkg.isPopular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <span>{t.packages.buy_now}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: VOUCHER REDEEM */}
        {activeTab === 'voucher' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm max-w-lg mx-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Ticket className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{t.voucher_tab.title}</h2>
              <p className="text-xs text-slate-500 mt-1">{t.voucher_tab.subtitle}</p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder={t.voucher_tab.input_placeholder}
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="w-full text-center tracking-widest uppercase font-mono text-base px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              {/* Quick sample voucher helpers for testing */}
              <div className="text-center">
                <span className="text-[11px] text-slate-400 block mb-1.5">Msimbo wa majaribio (Click to test):</span>
                <div className="flex justify-center gap-2 flex-wrap">
                  {['TZ-500-DEMO', 'TZ-1000-DEMO', 'TZ-2000-DEMO'].map((demoCode) => (
                    <button
                      key={demoCode}
                      onClick={() => setVoucherCode(demoCode)}
                      className="text-[11px] bg-slate-100 hover:bg-slate-200 font-mono py-1 px-2.5 rounded-lg text-slate-700 border border-slate-200"
                    >
                      {demoCode}
                    </button>
                  ))}
                </div>
              </div>

              {voucherMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    voucherMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {voucherMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{voucherMessage.text}</span>
                </div>
              )}

              <button
                onClick={handleRedeemVoucher}
                disabled={voucherLoading || !voucherCode.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                {voucherLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inathibitisha...</span>
                  </>
                ) : (
                  <span>{t.voucher_tab.redeem_button}</span>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-3">
                {t.voucher_tab.agent_note}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: ACCOUNT STATUS */}
        {activeTab === 'status' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm max-w-lg mx-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">{t.status_tab.title}</h2>
              <p className="text-xs text-slate-500 mt-1">{t.status_tab.subtitle}</p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Mfano: 0754123456 au TZ-1000-DEMO"
                  value={statusQuery}
                  onChange={(e) => setStatusQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm"
                />
                <button
                  onClick={handleCheckStatus}
                  disabled={statusLoading || !statusQuery.trim()}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition"
                >
                  {statusLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t.status_tab.check_button}
                </button>
              </div>

              {activeSession ? (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                    <span className="text-xs text-emerald-800 font-medium">Hali ya Intaneti</span>
                    <span className="text-[11px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">{t.status_tab.time_left}</span>
                      <span className="font-bold text-slate-800 text-sm">
                        {activeSession.formattedTimeRemaining || `${activeSession.minutesRemaining || 60} min`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{t.status_tab.expires_at}</span>
                      <span className="font-bold text-slate-800 text-xs">
                        {new Date(activeSession.expiresAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Kifurushi</span>
                      <span className="font-medium text-slate-800">{activeSession.packageName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">IP Address</span>
                      <span className="font-mono text-slate-800">{activeSession.ipAddress || '192.168.88.245'}</span>
                    </div>
                  </div>
                </div>
              ) : statusSearched ? (
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  Hakuna kifurushi kinachoendelea kwa sasa. Nunua kifurushi au weka vocha kuanza kutumia.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE MONEY PAYMENT MODAL */}
      {selectedPkg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            {paymentStep === 'INPUT' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{t.payment_modal.title}</h3>
                    <p className="text-xs text-slate-500">{lang === 'sw' ? selectedPkg.nameSw : selectedPkg.nameEn}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">{t.payment_modal.amount_to_pay}</span>
                    <span className="font-extrabold text-emerald-700 text-base">
                      TZS {selectedPkg.priceTzs.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {t.payment_modal.step1}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder={t.payment_modal.phone_placeholder}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-4 pr-24 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base font-semibold"
                    />
                    {carrier.provider !== 'UNKNOWN' && (
                      <div className="absolute right-2 top-2.5 flex items-center">
                        <span className={`text-[10px] text-white font-bold px-2 py-1 rounded-md ${carrier.color}`}>
                          {carrier.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Inakubali Vodacom M-Pesa (074/075/076), Tigo (065/067/071), Airtel (068/069/078), Halopesa (062).
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setSelectedPkg(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition"
                  >
                    {t.payment_modal.close}
                  </button>
                  <button
                    onClick={handleInitiatePayment}
                    disabled={!phoneNumber || carrier.provider === 'UNKNOWN'}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>{t.payment_modal.pay_button}</span>
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'PENDING' && (
              <div className="text-center py-6 space-y-4">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <Loader2 className="w-16 h-16 text-emerald-600 animate-spin" />
                  <Smartphone className="w-7 h-7 text-emerald-700 absolute" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{t.payment_modal.waiting_title}</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto leading-relaxed">
                    {t.payment_modal.waiting_desc.replace('{phone}', phoneNumber)}
                  </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-xl">
                  {t.payment_modal.verifying}
                </div>
                {/* Manual Check Button for delayed USSD prompts */}
                <div className="pt-2">
                  <button
                    onClick={async () => {
                      if (!paymentTxId) return;
                      try {
                        const res = await fetch(`/api/payments/status?id=${paymentTxId}`);
                        const data = await res.json();
                        if (data.status === 'SUCCESS') {
                          setPaymentStep('SUCCESS');
                          if (data.session) setActiveSession(data.session);
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
                  >
                    Nimeshaweka PIN? Kagua Malipo Sasa
                  </button>
                </div>
              </div>
            )}

            {paymentStep === 'SUCCESS' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{t.payment_modal.success_title}</h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                    {t.payment_modal.success_desc}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedPkg(null);
                    setActiveTab('status');
                    setStatusQuery(phoneNumber);
                    handleCheckStatus();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-sm"
                >
                  Angalia Hali ya Intaneti
                </button>
              </div>
            )}

            {paymentStep === 'FAILED' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{t.payment_modal.failed_title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{paymentError || t.payment_modal.failed_desc}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPkg(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                  >
                    {t.payment_modal.close}
                  </button>
                  <button
                    onClick={() => setPaymentStep('INPUT')}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    {t.payment_modal.retry}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-xs border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t.footer.powered_by}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-slate-400 hover:text-slate-200 transition text-[11px] underline underline-offset-2 flex items-center gap-1"
            >
              <span>Admin Dashboard</span>
            </Link>
            <Link
              href="/diagnostics"
              className="text-slate-400 hover:text-slate-200 transition text-[11px] underline underline-offset-2 flex items-center gap-1"
            >
              <span>MikroTik Diagnostics</span>
            </Link>
            <a
              href="https://wa.me/255754000000"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{t.footer.whatsapp}</span>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
