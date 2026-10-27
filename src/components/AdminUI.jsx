import React, { useState, useEffect } from 'react';

export default function AdminUI({ t, highContrast, onResetDemo }) {
  const [activeTab, setActiveTab] = useState('checkins'); // 'checkins' | 'hazards'
  const [checkins, setCheckins] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(new Date());

  // Filter states
  const [checkinFilter, setCheckinFilter] = useState('all'); // 'all', 'active', 'completed'
  const [checkinSearch, setCheckinSearch] = useState('');
  const [hazardSeverityFilter, setHazardSeverityFilter] = useState('all');
  const [hazardStatusFilter, setHazardStatusFilter] = useState('all');
  const [hazardSearch, setHazardSearch] = useState('');

  // Admin note editing
  const [editingHazardId, setEditingHazardId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Fetch all data
  const fetchData = async () => {
    try {
      const [resC, resH] = await Promise.all([
        fetch('/api/checkins'),
        fetch('/api/hazards')
      ]);
      if (resC.ok && resH.ok) {
        const cData = await resC.json();
        const hData = await resH.json();
        setCheckins(cData);
        setHazards(hData);
        setLastSynced(new Date());
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-polling every 3 seconds for live dashboard updates
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update Hazard Status
  const handleUpdateStatus = async (id, newStatus, adminNotes) => {
    try {
      const res = await fetch(`/api/hazards/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminNotes })
      });
      if (res.ok) {
        await fetchData();
        setEditingHazardId(null);
      }
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  // Calculate KPIs
  const activeCount = checkins.filter((c) => c.status === 'active').length;
  const totalCheckinCount = checkins.length;
  const openHazardCount = hazards.filter((h) => h.status === 'open').length;
  const criticalAlertCount = hazards.filter((h) => (h.severity === 'critical' || h.severity === 'high') && h.status !== 'resolved').length;
  const totalPayroll = checkins.reduce((sum, c) => {
    if (c.earnings) return sum + c.earnings;
    if (c.status === 'active') {
      const hours = Math.max(0, (Date.now() - new Date(c.checkInTime).getTime()) / (1000 * 3600));
      return sum + Math.round(hours * (c.hourlyRate || 350));
    }
    return sum;
  }, 0);

  // Filtered checkins
  const filteredCheckins = checkins.filter((c) => {
    if (checkinFilter === 'active' && c.status !== 'active') return false;
    if (checkinFilter === 'completed' && c.status !== 'completed') return false;
    if (checkinSearch) {
      const term = checkinSearch.toLowerCase();
      const matchName = c.workerName?.toLowerCase().includes(term);
      const matchId = c.workerId?.toLowerCase().includes(term);
      const matchLoc = c.location?.toLowerCase().includes(term);
      if (!matchName && !matchId && !matchLoc) return false;
    }
    return true;
  });

  // Filtered hazards
  const filteredHazards = hazards.filter((h) => {
    if (hazardSeverityFilter !== 'all' && h.severity !== hazardSeverityFilter) return false;
    if (hazardStatusFilter !== 'all' && h.status !== hazardStatusFilter) return false;
    if (hazardSearch) {
      const term = hazardSearch.toLowerCase();
      const matchDesc = h.description?.toLowerCase().includes(term);
      const matchBy = h.reportedBy?.toLowerCase().includes(term);
      const matchLoc = h.location?.toLowerCase().includes(term);
      if (!matchDesc && !matchBy && !matchLoc) return false;
    }
    return true;
  });

  // Export to CSV
  const handleExportCSV = () => {
    let csv = '';
    if (activeTab === 'checkins') {
      csv = 'Worker,WorkerID,Role,ShiftType,Status,CheckInTime,CheckOutTime,Location\n' +
        filteredCheckins.map(c => `"${c.workerName}","${c.workerId}","${c.role}","${c.shiftType}","${c.status}","${c.checkInTime}","${c.checkOutTime || ''}","${c.location}"`).join('\n');
    } else {
      csv = 'ID,ReportedBy,WorkerID,Category,Severity,Status,ReportedAt,Location,Description,AdminNotes\n' +
        filteredHazards.map(h => `"${h.id}","${h.reportedBy}","${h.workerId}","${h.category}","${h.severity}","${h.status}","${h.reportedAt}","${h.location}","${h.description.replace(/"/g, '""')}","${(h.adminNotes || '').replace(/"/g, '""')}"`).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairshift_${activeTab}_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Admin Title & Live Bar */}
      <div className={`p-5 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
        highContrast
          ? 'bg-black text-white border-yellow-400 shadow-[0_0_20px_rgba(255,255,0,0.25)]'
          : 'bg-white text-slate-900 border-slate-200 shadow-sm'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 text-xs font-black uppercase rounded ${
              highContrast ? 'bg-yellow-400 text-black' : 'bg-slate-900 text-amber-400'
            }`}>
              Admin Command
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{t.liveSyncBadge}</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight">
            {t.adminTitle}
          </h2>
          <p className={`text-xs sm:text-sm mt-0.5 ${highContrast ? 'text-yellow-300' : 'text-slate-600'}`}>
            {t.adminSubtitle}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchData}
            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border flex items-center gap-1.5 transition-colors ${
              highContrast
                ? 'bg-neutral-900 text-yellow-300 border-yellow-400 hover:bg-neutral-800'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            🔄 {t.btnRefresh}
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg border flex items-center gap-1.5 transition-colors ${
              highContrast
                ? 'bg-yellow-400 text-black border-white hover:bg-yellow-300'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* KPI Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Active Shifts */}
        <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
          highContrast ? 'bg-black text-white border-2 border-yellow-400' : 'bg-white text-slate-900 border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs uppercase font-bold text-slate-500 flex justify-between items-center">
            <span>{t.statActiveWorkers}</span>
            <span className="text-base">👷</span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black mt-2 ${highContrast ? 'text-yellow-400' : 'text-emerald-600'}`}>
            {activeCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Currently checked in</div>
        </div>

        {/* Card 2: Total Checkins */}
        <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
          highContrast ? 'bg-black text-white border-2 border-yellow-400' : 'bg-white text-slate-900 border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs uppercase font-bold text-slate-500 flex justify-between items-center">
            <span>{t.statTotalCheckins}</span>
            <span className="text-base">📋</span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black mt-2 ${highContrast ? 'text-yellow-400' : 'text-slate-900'}`}>
            {totalCheckinCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Recorded shifts</div>
        </div>

        {/* Card 3: Total Shift Payroll */}
        <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
          highContrast ? 'bg-black text-white border-2 border-yellow-400' : 'bg-white text-slate-900 border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs uppercase font-bold text-slate-500 flex justify-between items-center">
            <span>{t.statTotalPayroll}</span>
            <span className="text-base">💰</span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black mt-2 ${highContrast ? 'text-yellow-400' : 'text-amber-600'}`}>
            {t.currencySymbol}{totalPayroll.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Fair pay accrued</div>
        </div>

        {/* Card 4: Open Hazards */}
        <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
          highContrast ? 'bg-black text-white border-2 border-yellow-400' : 'bg-white text-slate-900 border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs uppercase font-bold text-slate-500 flex justify-between items-center">
            <span>{t.statOpenHazards}</span>
            <span className="text-base">⚠️</span>
          </div>
          <div className={`text-2xl sm:text-3xl font-black mt-2 ${highContrast ? 'text-yellow-400' : 'text-amber-600'}`}>
            {openHazardCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">Require triage / review</div>
        </div>

        {/* Card 5: Critical Alerts */}
        <div className={`p-4 sm:p-5 rounded-xl border transition-all ${
          criticalAlertCount > 0
            ? highContrast
              ? 'bg-neutral-950 text-red-400 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
              : 'bg-red-50 text-red-900 border-red-300'
            : highContrast
              ? 'bg-black text-white border-2 border-yellow-400'
              : 'bg-white text-slate-900 border-slate-200 shadow-sm'
        }`}>
          <div className="text-xs uppercase font-bold text-red-600 flex justify-between items-center">
            <span>{t.statCriticalHazards}</span>
            <span className="text-base">🚨</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 text-red-600">
            {criticalAlertCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">High & Critical risks</div>
        </div>
      </div>

      {/* Main Content Area with Navigation Tabs */}
      <div className={`rounded-2xl border transition-all overflow-hidden ${
        highContrast ? 'bg-black text-white border-2 border-yellow-400' : 'bg-white text-slate-900 border-slate-200 shadow-sm'
      }`}>
        {/* Tab Header */}
        <div className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
          highContrast ? 'bg-neutral-950 border-yellow-400/50' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'checkins'}
              onClick={() => setActiveTab('checkins')}
              className={`px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === 'checkins'
                  ? highContrast
                    ? 'bg-yellow-400 text-black border-2 border-white'
                    : 'bg-slate-900 text-white shadow-sm'
                  : highContrast
                    ? 'text-yellow-300 hover:bg-neutral-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <span>👷</span>
              <span>{t.tabCheckins}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'checkins' 
                  ? highContrast ? 'bg-black text-yellow-400' : 'bg-slate-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {checkins.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'hazards'}
              onClick={() => setActiveTab('hazards')}
              className={`px-4 py-2 rounded-lg text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === 'hazards'
                  ? highContrast
                    ? 'bg-yellow-400 text-black border-2 border-white'
                    : 'bg-slate-900 text-white shadow-sm'
                  : highContrast
                    ? 'text-yellow-300 hover:bg-neutral-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <span>🚨</span>
              <span>{t.tabHazards}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                criticalAlertCount > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-200 text-slate-700'
              }`}>
                {hazards.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Last synced: {lastSynced.toLocaleTimeString()}
          </div>
        </div>

        {/* TAB 1: Check-Ins Log */}
        {activeTab === 'checkins' && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {['all', 'active', 'completed'].map((statusKey) => (
                  <button
                    key={statusKey}
                    type="button"
                    onClick={() => setCheckinFilter(statusKey)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border capitalize transition-colors ${
                      checkinFilter === statusKey
                        ? highContrast
                          ? 'bg-yellow-400 text-black border-white'
                          : 'bg-slate-900 text-white border-slate-900'
                        : highContrast
                          ? 'border-yellow-400/50 text-yellow-300'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {statusKey === 'all' ? 'All Shifts' : statusKey === 'active' ? '🟢 Active Only' : '⚪ Completed'}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search worker name or ID..."
                value={checkinSearch}
                onChange={(e) => setCheckinSearch(e.target.value)}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border ${
                  highContrast 
                    ? 'bg-neutral-900 text-white border-yellow-400' 
                    : 'bg-slate-50 text-slate-900 border-slate-300'
                }`}
              />
            </div>

            {/* Check-ins Table */}
            {filteredCheckins.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">
                {t.emptyCheckins}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-black uppercase tracking-wider ${
                      highContrast ? 'border-yellow-400 text-yellow-300' : 'border-slate-200 text-slate-500 bg-slate-50'
                    }`}>
                      <th className="p-3">{t.colWorker}</th>
                      <th className="p-3">{t.colRole}</th>
                      <th className="p-3">{t.colLocation}</th>
                      <th className="p-3">{t.colCheckInTime}</th>
                      <th className="p-3">{t.colDuration}</th>
                      <th className="p-3">{t.colEarnings}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-current/10 text-sm">
                    {filteredCheckins.map((item) => (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          highContrast
                            ? 'hover:bg-neutral-900'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-3">
                          <div className="font-bold">{item.workerName}</div>
                          <div className="text-xs text-slate-400 font-mono">{item.workerId}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold">{item.role || 'Staff'}</div>
                          <div className="text-xs text-slate-500">{item.shiftType}</div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs font-medium bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                            {item.location}
                          </span>
                        </td>
                        <td className="p-3 text-xs">
                          <div>{new Date(item.checkInTime).toLocaleDateString()}</div>
                          <div className="font-mono text-slate-500">{new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="p-3">
                          {item.status === 'active' ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              highContrast
                                ? 'bg-yellow-400 text-black'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                              {t.statusActive}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                              ✓ {t.statusCompleted} {item.hoursWorked ? `(${item.hoursWorked}h)` : ''}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {item.status === 'active' ? (
                            <div>
                              <div className="font-mono font-bold text-amber-600">
                                ~{t.currencySymbol}{Math.round(Math.max(0, (Date.now() - new Date(item.checkInTime).getTime()) / 3600000) * (item.hourlyRate || 350))}
                              </div>
                              <div className="text-xs text-slate-400">
                                ({t.currencySymbol}{item.hourlyRate || 350}/h)
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-mono font-bold text-slate-900">
                                {t.currencySymbol}{item.earnings || Math.round((item.hoursWorked || 0) * (item.hourlyRate || 350))}
                              </div>
                              <div className="text-xs text-slate-400">
                                ({t.currencySymbol}{item.hourlyRate || 350}/h)
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Safety Hazards Incident Board */}
        {activeTab === 'hazards' && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={hazardSeverityFilter}
                  onChange={(e) => setHazardSeverityFilter(e.target.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                    highContrast ? 'bg-neutral-900 text-white border-yellow-400' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Only</option>
                  <option value="medium">Medium Only</option>
                  <option value="low">Low Only</option>
                </select>

                <select
                  value={hazardStatusFilter}
                  onChange={(e) => setHazardStatusFilter(e.target.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                    highContrast ? 'bg-neutral-900 text-white border-yellow-400' : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open Only</option>
                  <option value="investigating">Investigating Only</option>
                  <option value="resolved">Resolved Only</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Search description, location or reporter..."
                value={hazardSearch}
                onChange={(e) => setHazardSearch(e.target.value)}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg border ${
                  highContrast ? 'bg-neutral-900 text-white border-yellow-400' : 'bg-slate-50 text-slate-900 border-slate-300'
                }`}
              />
            </div>

            {/* Hazard Cards */}
            {filteredHazards.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">
                {t.emptyHazards}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHazards.map((hazard) => {
                  const isEditing = editingHazardId === hazard.id;

                  // Severity badge colors
                  const sevStyles = {
                    critical: 'bg-red-600 text-white border-red-700',
                    high: 'bg-orange-500 text-white border-orange-600',
                    medium: 'bg-amber-500 text-slate-950 border-amber-600',
                    low: 'bg-emerald-600 text-white border-emerald-700'
                  };

                  return (
                    <div
                      key={hazard.id}
                      className={`p-4 sm:p-5 rounded-xl border transition-all ${
                        hazard.status === 'resolved'
                          ? highContrast ? 'bg-neutral-950 border-neutral-700 opacity-75' : 'bg-slate-50 border-slate-200 opacity-80'
                          : hazard.severity === 'critical'
                            ? highContrast ? 'bg-neutral-900 border-2 border-red-500' : 'bg-red-50/50 border-red-300'
                            : highContrast ? 'bg-black border-2 border-yellow-400' : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="flex items-center flex-wrap gap-2">
                          {/* Severity Badge */}
                          <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase tracking-wider border ${
                            sevStyles[hazard.severity] || 'bg-slate-800 text-white'
                          }`}>
                            {hazard.severity} Severity
                          </span>

                          {/* Category Pill */}
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-semibold uppercase">
                            {t.hazardCategories[hazard.category] || hazard.category}
                          </span>

                          {/* Status Pill */}
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            hazard.status === 'open'
                              ? 'bg-red-100 text-red-800 border border-red-300'
                              : hazard.status === 'investigating'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            ● {hazard.status === 'open' ? t.statusOpen : hazard.status === 'investigating' ? t.statusInvestigating : t.statusResolved}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 font-mono">
                          ID: #{hazard.id} • {new Date(hazard.reportedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>

                      {/* Hazard Description */}
                      <p className={`text-sm sm:text-base font-semibold my-2 ${
                        highContrast ? 'text-white' : 'text-slate-900'
                      }`}>
                        {hazard.description}
                      </p>

                      {/* Location & Reporter meta */}
                      <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mb-3">
                        <span>📍 Location: <strong className="text-current">{hazard.location}</strong></span>
                        <span>👤 Reported by: <strong className="text-current">{hazard.reportedBy} ({hazard.workerId})</strong></span>
                      </div>

                      {/* Admin Note if available */}
                      {hazard.adminNotes && (
                        <div className={`p-2.5 rounded-lg text-xs mb-3 border ${
                          highContrast ? 'bg-neutral-900 text-yellow-300 border-yellow-400' : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}>
                          <strong className="block mb-0.5">Admin Action Log:</strong>
                          {hazard.adminNotes}
                        </div>
                      )}

                      {/* Triage Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-current/10">
                        <div className="flex items-center gap-2">
                          {hazard.status === 'open' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(hazard.id, 'investigating', hazard.adminNotes)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                highContrast
                                  ? 'bg-yellow-400 text-black border-white hover:bg-yellow-300'
                                  : 'bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-400'
                              }`}
                            >
                              🔍 {t.btnMarkInvestigating}
                            </button>
                          )}

                          {hazard.status !== 'resolved' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(hazard.id, 'resolved', hazard.adminNotes || 'Inspected and cleared by Shift Safety Admin')}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                highContrast
                                  ? 'bg-white text-black border-2 border-yellow-400 hover:bg-slate-200'
                                  : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                              }`}
                            >
                              ✅ {t.btnMarkResolved}
                            </button>
                          )}

                          {hazard.status === 'resolved' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(hazard.id, 'open', hazard.adminNotes)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              ↩️ {t.btnReopen}
                            </button>
                          )}
                        </div>

                        {/* Inline Note Toggle */}
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0">
                            <input
                              type="text"
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder={t.notesPlaceholder}
                              className={`px-2.5 py-1 text-xs rounded border w-full sm:w-64 ${
                                highContrast ? 'bg-neutral-900 text-white border-yellow-400' : 'bg-white border-slate-300'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(hazard.id, hazard.status, noteDraft)}
                              className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingHazardId(null)}
                              className="px-2 py-1 text-xs text-slate-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingHazardId(hazard.id);
                              setNoteDraft(hazard.adminNotes || '');
                            }}
                            className="text-xs text-slate-500 hover:text-slate-900 underline"
                          >
                            {hazard.adminNotes ? 'Edit Note' : '+ Add Admin Note'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
