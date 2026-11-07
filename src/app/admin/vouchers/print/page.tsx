'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Printer, ArrowLeft, Wifi, Scissors, RefreshCw } from 'lucide-react';
import { WIFI_PACKAGES } from '@/lib/packages';

export default function VoucherPrintPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPackage, setFilterPackage] = useState<string>('all');
  const [printSize, setPrintSize] = useState<'thermal58' | 'thermal80' | 'grid'>('grid');

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vouchers?status=UNUSED');
      const data = await res.json();
      if (data.success) {
        setVouchers(data.vouchers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const filteredVouchers = filterPackage === 'all'
    ? vouchers
    : vouchers.filter((v) => v.packageId === filterPackage);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 print:p-0 print:bg-white text-slate-800">
      {/* Non-printing Control Header */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Rudi Admin Dashboard
          </Link>

          <button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Chapa Vocha Sasa (Print Tickets)
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Kifurushi:</span>
            <select
              value={filterPackage}
              onChange={(e) => setFilterPackage(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
            >
              <option value="all">Vifurushi Vyote ({vouchers.length})</option>
              {WIFI_PACKAGES.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.nameSw} (TZS {pkg.priceTzs.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Muundo wa Karatasi:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPrintSize('grid')}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  printSize === 'grid'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Karatasi A4 / Grid
              </button>
              <button
                onClick={() => setPrintSize('thermal58')}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  printSize === 'thermal58'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Thermal 58mm (POS)
              </button>
              <button
                onClick={() => setPrintSize('thermal80')}
                className={`px-3 py-1.5 rounded-lg font-bold ${
                  printSize === 'thermal80'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Thermal 80mm (POS)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="max-w-4xl mx-auto print:max-w-none print:w-full">
        {printSize === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            {filteredVouchers.map((voucher) => (
              <div
                key={voucher.code}
                className="bg-white border-2 border-dashed border-slate-300 p-4 rounded-xl flex flex-col justify-between text-center relative print:border-black print:rounded-none print:break-inside-avoid"
              >
                <div className="absolute -top-3 left-3 bg-white px-1 text-slate-400 print:hidden">
                  <Scissors className="w-3.5 h-3.5" />
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1.5 text-emerald-800 print:text-black mb-1">
                    <Wifi className="w-4 h-4" />
                    <span className="font-extrabold text-xs tracking-wider uppercase">MtaaWiFi Hotspot</span>
                  </div>

                  <div className="bg-slate-50 print:bg-transparent py-1 px-2 rounded mb-2 border border-slate-100 print:border-none">
                    <span className="text-xs font-bold text-slate-900 block">{voucher.packageName}</span>
                    <span className="text-sm font-black text-emerald-700 print:text-black">
                      TZS {voucher.priceTzs?.toLocaleString()}
                    </span>
                  </div>

                  {/* Monospace Code */}
                  <div className="border-2 border-slate-900 py-2 px-1 rounded-lg my-2 bg-slate-50 print:bg-white">
                    <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Nambari ya Vocha</span>
                    <span className="font-mono text-base font-black tracking-widest text-slate-900">
                      {voucher.code}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-600 space-y-0.5 mt-2 border-t border-slate-200 pt-2 print:border-black">
                  <p>1. Unganisha Wi-Fi: <strong>MtaaWiFi</strong></p>
                  <p>2. Chagua "Weka Vocha" & ingiza nambari hii.</p>
                  <p className="text-[9px] text-slate-400 print:text-black mt-1">Msaada WhatsApp: 0754 000 000</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Thermal POS Roll Preview (58mm or 80mm) */
          <div className="flex flex-col items-center space-y-4 print:space-y-0">
            {filteredVouchers.map((voucher) => (
              <div
                key={voucher.code}
                style={{ width: printSize === 'thermal58' ? '58mm' : '80mm' }}
                className="bg-white border border-slate-300 p-3 text-center print:border-b-2 print:border-dashed print:border-black print:break-after-page text-black font-mono"
              >
                <div className="text-xs font-bold tracking-tight uppercase mb-1">
                  *** MTAAWIFI HOTSPOT ***
                </div>
                <div className="text-[11px] font-bold">
                  {voucher.packageName}
                </div>
                <div className="text-sm font-black my-1">
                  TZS {voucher.priceTzs?.toLocaleString()}
                </div>

                <div className="border-t border-b border-black py-2 my-2">
                  <div className="text-[9px] uppercase">Nambari ya Vocha:</div>
                  <div className="text-base font-black tracking-widest">
                    {voucher.code}
                  </div>
                </div>

                <div className="text-[9px] text-left space-y-0.5 my-2">
                  <div>* Unganisha Wi-Fi ya MtaaWiFi</div>
                  <div>* Chagua Weka Vocha kwenye portal</div>
                  <div>* Ingiza kodi ya hapo juu</div>
                </div>

                <div className="text-[8px] border-t border-dotted border-black pt-1">
                  Asante kwa kuchagua MtaaWiFi!
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredVouchers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs">
            Hakuna vocha ambazo hazijatumika kwa sasa. Nenda Admin Dashboard kutengeneza batch mpya.
          </div>
        )}
      </div>
    </div>
  );
}
