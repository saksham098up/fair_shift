import React, { useState, useEffect, useRef } from 'react';

export default function WorkerUI({ lang = 'en', t, highContrast, onCheckinChange }) {
  // Worker profile state
  const [workerName, setWorkerName] = useState(() => localStorage.getItem('fs_worker_name') || 'Rajesh Kumar');
  const [workerId, setWorkerId] = useState(() => localStorage.getItem('fs_worker_id') || 'EMP-4081');
  const [hourlyRate, setHourlyRate] = useState(() => Number(localStorage.getItem('fs_hourly_rate')) || 350);
  const [role, setRole] = useState('Forklift Operator');
  const [shiftType, setShiftType] = useState('Morning');
  const [location, setLocation] = useState('Warehouse Bay 4');

  // Active check-in state
  const [activeCheckin, setActiveCheckin] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loadingShift, setLoadingShift] = useState(false);
  const [shiftFeedback, setShiftFeedback] = useState(null);

  // Safety Hazard Report state
  const [hazardText, setHazardText] = useState('');
  const [hazardCategory, setHazardCategory] = useState('slip_trip');
  const [hazardSeverity, setHazardSeverity] = useState('medium');
  const [hazardLocation, setHazardLocation] = useState('');
  const [submittingHazard, setSubmittingHazard] = useState(false);
  const [hazardFeedback, setHazardFeedback] = useState(null);

  // Speech Recognition (Web Speech API) for Limited Literacy Support
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);

  // Save worker profile changes
  useEffect(() => {
    localStorage.setItem('fs_worker_name', workerName);
    localStorage.setItem('fs_worker_id', workerId);
    localStorage.setItem('fs_hourly_rate', hourlyRate.toString());
  }, [workerName, workerId, hourlyRate]);

  // Fetch active check-in on mount or worker name change
  const fetchActiveStatus = async () => {
    try {
      const res = await fetch(`/api/checkins/active?workerName=${encodeURIComponent(workerName)}&workerId=${encodeURIComponent(workerId)}`);
      if (res.ok) {
        const data = await res.json();
        setActiveCheckin(data.activeCheckin);
      }
    } catch (err) {
      console.error('Failed to query active check-in', err);
    }
  };

  useEffect(() => {
    fetchActiveStatus();
  }, [workerName, workerId]);

  // Live timer for active shift
  useEffect(() => {
    if (!activeCheckin) {
      setElapsedSeconds(0);
      return;
    }
    const updateTimer = () => {
      const start = new Date(activeCheckin.checkInTime).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeCheckin]);

  const formatElapsed = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Shift Check-in / Check-out
  const handleShiftAction = async (actionType) => {
    if (!workerName.trim()) {
      setShiftFeedback({ type: 'error', message: 'Please enter your name.' });
      return;
    }
    setLoadingShift(true);
    setShiftFeedback(null);
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          workerName,
          workerId,
          role,
          shiftType,
          hourlyRate: Number(hourlyRate) || 350,
          location: location || 'Main Facility'
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update shift');
      }

      if (actionType === 'checkout') {
        setActiveCheckin(null);
        const earnedText = result.checkin?.earnings ? ` • ${t.currencySymbol}${result.checkin.earnings}` : '';
        const hoursText = result.checkin?.hoursWorked ? ` (${result.checkin.hoursWorked} hrs)` : '';
        setShiftFeedback({
          type: 'success',
          message: `${t.checkoutSuccessMsg} ${hoursText} ${earnedText}`
        });
      } else {
        setActiveCheckin(result.checkin);
        setShiftFeedback({ type: 'success', message: t.checkinSuccessMsg });
      }

      if (onCheckinChange) onCheckinChange();
    } catch (err) {
      setShiftFeedback({ type: 'error', message: err.message });
    } finally {
      setLoadingShift(false);
    }
  };

  // GPS auto-detection
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const locStr = `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Verified)`;
          setLocation(locStr);
          if (!hazardLocation) setHazardLocation(locStr);
        },
        () => {
          setLocation('Main Facility Zone A (Default)');
        }
      );
    } else {
      setLocation('Main Facility Zone A');
    }
  };

  // Submit Safety Hazard
  const handleSubmitHazard = async (e) => {
    e.preventDefault();
    if (!hazardText.trim()) {
      setHazardFeedback({ type: 'error', message: 'Please describe the hazard.' });
      return;
    }

    setSubmittingHazard(true);
    setHazardFeedback(null);
    try {
      const res = await fetch('/api/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedBy: workerName || 'Field Worker',
          workerId: workerId || 'EMP-4081',
          category: hazardCategory,
          severity: hazardSeverity,
          location: hazardLocation || location || 'Facility Floor',
          description: hazardText.trim()
        })
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit report');
      }

      setHazardFeedback({
        type: 'success',
        message: t.hazardSubmittedAlert + ` (Ref: #${result.hazard.id})`
      });
      setHazardText('');
      setHazardLocation('');
      if (onCheckinChange) onCheckinChange();
    } catch (err) {
      setHazardFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmittingHazard(false);
    }
  };

  // Web Speech API Voice Transcription
  const toggleVoiceRecording = () => {
    setVoiceError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(t.voiceNotSupported);
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setVoiceError(null);
      };

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        setHazardText(fullTranscript.trim());
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError('Microphone access was denied. Please allow microphone permission in your browser URL bar.');
        } else if (event.error !== 'no-speech') {
          setVoiceError(`Voice recognition: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition', err);
      setVoiceError('Could not start microphone: ' + err.message);
      setIsRecording(false);
    }
  };

  // Stop recording on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Pre-fill hazard template for quick hackathon testing
  const handlePresetHazard = (text, category, severity) => {
    setHazardText(text);
    setHazardCategory(category);
    setHazardSeverity(severity);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Mobile Top Welcome Header */}
      <div className={`p-5 rounded-2xl border transition-all ${
        highContrast 
          ? 'bg-black text-white border-yellow-400 shadow-[0_0_20px_rgba(255,255,0,0.3)]' 
          : 'bg-white text-slate-900 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className={`inline-block px-2.5 py-1 text-xs font-black uppercase rounded-md tracking-wider ${
              highContrast ? 'bg-yellow-400 text-black' : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              {t.workerHeroTitle}
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-2 leading-tight">
              {activeCheckin ? `${workerName} - ${t.statusActive}` : `${workerName || 'Worker'}`}
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${highContrast ? 'text-yellow-300 font-bold' : 'text-slate-600'}`}>
              {t.workerHeroSub}
            </p>
          </div>
          <div className="text-4xl sm:text-5xl select-none" aria-hidden="true">
            👷
          </div>
        </div>

        {/* Worker Profile Mini-Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-dashed border-current/20">
          <div>
            <label className={`block text-xs font-bold mb-1 ${highContrast ? 'text-yellow-300' : 'text-slate-700'}`}>
              {t.workerNameLabel}
            </label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              placeholder={t.workerNamePlaceholder}
              className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                highContrast 
                  ? 'bg-neutral-900 text-white border-2 border-yellow-400 focus:bg-black' 
                  : 'bg-slate-50 text-slate-900 border border-slate-300 focus:border-amber-500 focus:bg-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1 ${highContrast ? 'text-yellow-300' : 'text-slate-700'}`}>
              {t.workerIdLabel}
            </label>
            <input
              type="text"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              placeholder={t.workerIdPlaceholder}
              className={`w-full px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                highContrast 
                  ? 'bg-neutral-900 text-white border-2 border-yellow-400' 
                  : 'bg-slate-50 text-slate-900 border border-slate-300 focus:border-amber-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1 ${highContrast ? 'text-yellow-300' : 'text-slate-700'}`}>
              {t.locationLabel}
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t.locationPlaceholder}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${
                  highContrast 
                    ? 'bg-neutral-900 text-white border-2 border-yellow-400' 
                    : 'bg-slate-50 text-slate-900 border border-slate-300'
                }`}
              />
              <button
                type="button"
                onClick={handleDetectLocation}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg border flex items-center ${
                  highContrast 
                    ? 'bg-yellow-400 text-black border-white' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
                title={t.detectGps}
              >
                📍
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1 ${highContrast ? 'text-yellow-300' : 'text-slate-700'}`}>
              {t.hourlyRateLabel} ({t.currencySymbol}{t.rateSuffix})
            </label>
            <div className="flex items-center">
              <span className={`px-3 py-2 rounded-l-lg border border-r-0 text-sm font-black ${
                highContrast ? 'bg-neutral-800 text-yellow-300 border-yellow-400' : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                {t.currencySymbol}
              </span>
              <input
                type="number"
                min="50"
                max="5000"
                step="10"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-r-lg text-sm font-semibold transition-colors ${
                  highContrast 
                    ? 'bg-neutral-900 text-white border-2 border-yellow-400' 
                    : 'bg-slate-50 text-slate-900 border border-slate-300 focus:border-amber-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-xs font-bold mb-1 ${highContrast ? 'text-yellow-300' : 'text-slate-700'}`}>
              {t.shiftTypeLabel}
            </label>
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg text-sm font-semibold ${
                highContrast 
                  ? 'bg-neutral-900 text-white border-2 border-yellow-400' 
                  : 'bg-slate-50 text-slate-900 border border-slate-300'
              }`}
            >
              <option value="Morning">Morning Shift (06:00 - 14:00)</option>
              <option value="Afternoon">Afternoon Shift (14:00 - 22:00)</option>
              <option value="Night">Night Shift (22:00 - 06:00)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary Shift Action Card: Large Mobile Check-In Button */}
      <div className={`p-6 sm:p-8 rounded-2xl border transition-all text-center ${
        highContrast 
          ? 'bg-black border-2 border-yellow-400 shadow-[0_0_25px_rgba(255,255,0,0.25)]' 
          : 'bg-white border-slate-200 shadow-md'
      }`}>
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 text-sm font-black uppercase tracking-wider">
          {activeCheckin ? (
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              highContrast 
                ? 'bg-yellow-400 text-black font-black' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              {t.statusActive}
            </span>
          ) : (
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${
              highContrast 
                ? 'bg-neutral-800 text-yellow-300 border border-yellow-400' 
                : 'bg-slate-100 text-slate-700 border border-slate-300'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              {t.statusNotCheckedIn}
            </span>
          )}
        </div>

        {/* Active Shift Details & Live Timer & Live Earnings */}
        {activeCheckin && (
          <div className={`mb-6 p-4 sm:p-5 rounded-xl border ${
            highContrast ? 'bg-neutral-950 border-yellow-400 text-white' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Shift Timer */}
              <div className="text-center sm:border-r border-current/15 sm:pr-4">
                <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
                  {t.timerLabel}
                </div>
                <div className={`text-3xl sm:text-4xl font-black font-mono my-1 tracking-tight ${
                  highContrast ? 'text-yellow-400' : 'text-emerald-700'
                }`}>
                  {formatElapsed(elapsedSeconds)}
                </div>
                <div className="text-xs text-slate-500">
                  {t.checkInTimeLabel}: <strong>{new Date(activeCheckin.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
              </div>

              {/* Live Real-Time Earnings Ticker */}
              <div className="text-center sm:pl-2">
                <div className="text-xs uppercase font-extrabold tracking-wider flex items-center justify-center gap-1 text-amber-600">
                  <span>💰</span>
                  <span>{t.liveEarningsLabel}</span>
                </div>
                <div className={`text-3xl sm:text-4xl font-black font-mono my-1 ${
                  highContrast ? 'text-yellow-300' : 'text-slate-900'
                }`}>
                  {t.currencySymbol} {((elapsedSeconds / 3600) * (activeCheckin.hourlyRate || hourlyRate)).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">
                  {t.currencySymbol}{activeCheckin.hourlyRate || hourlyRate}{t.rateSuffix} • {t.earnedSoFar}
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 text-center mt-3 pt-3 border-t border-dashed border-current/15">
              Workstation: <strong>{activeCheckin.location}</strong> • Role: <strong>{activeCheckin.role}</strong>
            </div>
          </div>
        )}

        {/* Shift Notification Feedback */}
        {shiftFeedback && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-bold border ${
            shiftFeedback.type === 'success'
              ? highContrast 
                ? 'bg-neutral-900 text-yellow-300 border-yellow-400' 
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : highContrast
                ? 'bg-neutral-900 text-red-400 border-red-500'
                : 'bg-red-50 text-red-800 border-red-300'
          }`}>
            {shiftFeedback.message}
          </div>
        )}

        {/* The Big Shift Button */}
        {activeCheckin ? (
          <button
            type="button"
            disabled={loadingShift}
            onClick={() => handleShiftAction('checkout')}
            className={`w-full py-5 px-6 rounded-2xl text-lg sm:text-xl font-black tracking-wide uppercase transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3 ${
              highContrast
                ? 'bg-red-600 hover:bg-red-500 text-white border-4 border-white'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'
            }`}
          >
            <span className="text-2xl">🛑</span>
            <span>{loadingShift ? '...' : t.btnCheckOut}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={loadingShift}
            onClick={() => handleShiftAction('checkin')}
            className={`w-full py-6 px-6 rounded-2xl text-xl sm:text-2xl font-black tracking-wider uppercase transition-all transform active:scale-95 shadow-2xl flex items-center justify-center gap-3 ${
              highContrast
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/30'
            }`}
          >
            <span className="text-3xl">⏱️</span>
            <span>{loadingShift ? '...' : t.btnCheckIn}</span>
          </button>
        )}
      </div>

      {/* Safety Hazard Reports Section */}
      <div className={`p-6 sm:p-7 rounded-2xl border transition-all ${
        highContrast 
          ? 'bg-black text-white border-2 border-yellow-400 shadow-[0_0_20px_rgba(255,255,0,0.2)]' 
          : 'bg-white text-slate-900 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
              {t.hazardHeader}
            </h3>
            <p className={`text-xs sm:text-sm mt-1 ${highContrast ? 'text-yellow-300' : 'text-slate-600'}`}>
              {t.hazardSub}
            </p>
          </div>
          <span className={`px-2.5 py-1 text-xs font-black uppercase rounded ${
            highContrast ? 'bg-yellow-400 text-black' : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            Safety Voice
          </span>
        </div>

        {/* Quick Demo Templates for hackathon judges */}
        <div className="mb-4">
          <span className={`text-xs font-bold block mb-1.5 ${highContrast ? 'text-yellow-300' : 'text-slate-500'}`}>
            ⚡ Quick Report Fill (Hackathon Helpers):
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handlePresetHazard('Oil spill near packaging conveyer. Slip risk.', 'slip_trip', 'high')}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                highContrast 
                  ? 'border-yellow-400 text-yellow-300 hover:bg-neutral-900' 
                  : 'border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              ⚠️ Oil Spill
            </button>
            <button
              type="button"
              onClick={() => handlePresetHazard('High voltage switch box sparking during motor start.', 'electrical', 'critical')}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                highContrast 
                  ? 'border-yellow-400 text-yellow-300 hover:bg-neutral-900' 
                  : 'border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              ⚡ Sparking Box
            </button>
            <button
              type="button"
              onClick={() => handlePresetHazard('Fire extinguisher inspection expired in Bay 4.', 'fire', 'low')}
              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-colors ${
                highContrast 
                  ? 'border-yellow-400 text-yellow-300 hover:bg-neutral-900' 
                  : 'border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              🧯 Expired Extinguisher
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmitHazard} className="space-y-4">
          {/* Urgency / Severity Selection Chips */}
          <div>
            <label className={`block text-xs font-black uppercase mb-1.5 ${highContrast ? 'text-yellow-300' : 'text-slate-700'}`}>
              {t.hazardSeverityLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'low', label: 'Low', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
                { key: 'medium', label: 'Medium', color: 'border-amber-500 text-amber-700 bg-amber-50' },
                { key: 'high', label: 'High', color: 'border-orange-500 text-orange-700 bg-orange-50' },
                { key: 'critical', label: 'Critical', color: 'border-red-600 text-red-700 bg-red-50' },
              ].map((sev) => {
                const isSelected = hazardSeverity === sev.key;
                return (
                  <button
                    key={sev.key}
                    type="button"
                    onClick={() => setHazardSeverity(sev.key)}
                    className={`py-2 px-2 text-xs font-black rounded-lg border-2 uppercase transition-all ${
                      isSelected
                        ? highContrast
                          ? 'bg-yellow-400 text-black border-white shadow-md'
                          : 'bg-slate-900 text-white border-slate-900 shadow-md scale-102'
                        : highContrast
                          ? 'bg-black text-yellow-300 border-yellow-400/50'
                          : `${sev.color} border-slate-200`
                    }`}
                  >
                    {sev.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category & Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-bold mb-1 ${highContrast ? 'text-yellow-300' : 'text-slate-700'}`}>
                {t.hazardCategoryLabel}
              </label>
              <select
                value={hazardCategory}
                onChange={(e) => setHazardCategory(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm font-semibold ${
                  highContrast 
                    ? 'bg-neutral-900 text-white border-2 border-yellow-400' 
                    : 'bg-slate-50 text-slate-900 border border-slate-300'
                }`}
              >
                {Object.entries(t.hazardCategories).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1 ${highContrast ? 'text-yellow-300' : 'text-slate-700'}`}>
                {t.locationLabel}
              </label>
              <input
                type="text"
                value={hazardLocation}
                onChange={(e) => setHazardLocation(e.target.value)}
                placeholder="e.g. Aisle 7, Loading Dock"
                className={`w-full px-3 py-2 rounded-lg text-sm font-semibold ${
                  highContrast 
                    ? 'bg-neutral-900 text-white border-2 border-yellow-400' 
                    : 'bg-slate-50 text-slate-900 border border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Simple Hazard Description Text Box with Web Speech Voice Record Button */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className={`block text-xs font-bold ${highContrast ? 'text-yellow-300' : 'text-slate-700'}`}>
                {t.hazardDescLabel} <span className="text-red-500">*</span>
              </label>

              {/* Microphone 'Voice Record' Button for Limited Literacy Support */}
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse border-2 border-white ring-2 ring-red-400'
                    : highContrast
                      ? 'bg-yellow-400 text-black border-2 border-white hover:bg-yellow-300'
                      : 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold'
                }`}
                title="Use microphone to dictate hazard report"
                aria-label="Voice Record Button"
              >
                <span className="text-base select-none">{isRecording ? '🔴' : '🎙️'}</span>
                <span>{isRecording ? t.voiceBtnListening : t.voiceBtnIdle}</span>
              </button>
            </div>

            {/* Active Listening Indicator */}
            {isRecording && (
              <div className={`mb-2 p-2.5 rounded-lg text-xs font-bold flex items-center justify-between gap-2 transition-all ${
                highContrast 
                  ? 'bg-neutral-900 text-yellow-300 border-2 border-yellow-400' 
                  : 'bg-amber-50 text-amber-900 border border-amber-300 shadow-inner'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  <span>{t.voiceListeningMsg}</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider opacity-75 font-mono">
                  {lang === 'hi' ? 'भाषा: हिन्दी' : 'Lang: English'}
                </span>
              </div>
            )}

            {/* Voice Error Notice */}
            {voiceError && (
              <div className="mb-2 p-2.5 rounded-lg text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                ⚠️ {voiceError}
              </div>
            )}

            <textarea
              required
              rows={4}
              value={hazardText}
              onChange={(e) => setHazardText(e.target.value)}
              placeholder={t.hazardDescPlaceholder}
              className={`w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                highContrast 
                  ? 'bg-neutral-900 text-white border-2 border-yellow-400 focus:bg-black placeholder:text-neutral-500' 
                  : 'bg-slate-50 text-slate-900 border border-slate-300 focus:border-amber-500 focus:bg-white placeholder:text-slate-400'
              }`}
            />
            
            <div className={`text-[11px] mt-1 flex items-center justify-between ${
              highContrast ? 'text-yellow-400/80' : 'text-slate-500'
            }`}>
              <span>{t.voiceLiteracyBadge}</span>
              <span>{hazardText.length} chars</span>
            </div>
          </div>

          {/* Hazard Submission Feedback */}
          {hazardFeedback && (
            <div className={`p-3 rounded-lg text-sm font-bold border ${
              hazardFeedback.type === 'success'
                ? highContrast 
                  ? 'bg-neutral-900 text-yellow-300 border-yellow-400' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : highContrast
                  ? 'bg-neutral-900 text-red-400 border-red-500'
                  : 'bg-red-50 text-red-800 border-red-300'
            }`}>
              {hazardFeedback.message}
            </div>
          )}

          {/* Submit Hazard Button */}
          <button
            type="submit"
            disabled={submittingHazard}
            className={`w-full py-3.5 px-6 rounded-xl text-base font-black uppercase tracking-wider transition-all transform active:scale-98 shadow-md flex items-center justify-center gap-2 ${
              highContrast
                ? 'bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <span>🚨</span>
            <span>{submittingHazard ? t.btnSubmittingHazard : t.btnSubmitHazard}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
