const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { readData, writeData, resetDemoData } = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FairShift Cloud Run API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GET all check-ins
app.get('/api/checkins', (req, res) => {
  const data = readData();
  const sorted = [...(data.checkins || [])].sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
  res.json(sorted);
});

// POST new check-in or toggle check-out
app.get('/api/checkins/active', (req, res) => {
  const { workerName, workerId } = req.query;
  const data = readData();
  const active = (data.checkins || []).find(
    (c) => c.status === 'active' && ((workerId && c.workerId === workerId) || (workerName && c.workerName.toLowerCase() === workerName.toLowerCase()))
  );
  res.json({ activeCheckin: active || null });
});

app.post('/api/checkins', (req, res) => {
  const { workerName, workerId, role, shiftType, location, action, hourlyRate } = req.body;
  
  if (!workerName || !workerName.trim()) {
    return res.status(400).json({ error: 'Worker name is required' });
  }

  const cleanName = workerName.trim();
  const cleanId = (workerId && workerId.trim()) || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
  const rate = Number(hourlyRate) > 0 ? Number(hourlyRate) : 300;
  const data = readData();
  data.checkins = data.checkins || [];

  // Check if checking out
  if (action === 'checkout') {
    const activeIndex = data.checkins.findIndex(
      (c) => c.status === 'active' && (c.workerId === cleanId || c.workerName.toLowerCase() === cleanName.toLowerCase())
    );

    if (activeIndex === -1) {
      return res.status(404).json({ error: 'No active check-in found to check out.' });
    }

    const checkin = data.checkins[activeIndex];
    const now = new Date();
    checkin.checkOutTime = now.toISOString();
    checkin.status = 'completed';
    const hours = ((now - new Date(checkin.checkInTime)) / (1000 * 60 * 60)).toFixed(2);
    checkin.hoursWorked = parseFloat(hours);
    const workerHourlyRate = checkin.hourlyRate || rate;
    checkin.earnings = Math.round(parseFloat(hours) * workerHourlyRate);

    data.checkins[activeIndex] = checkin;
    writeData(data);
    return res.json({ message: 'Checked out successfully', checkin });
  }

  // Create new check-in
  // Check if already active
  const existingActive = data.checkins.find(
    (c) => c.status === 'active' && (c.workerId === cleanId || c.workerName.toLowerCase() === cleanName.toLowerCase())
  );

  if (existingActive) {
    return res.status(400).json({
      error: 'Worker is already checked into an active shift.',
      activeCheckin: existingActive
    });
  }

  const newCheckin = {
    id: `chk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    workerName: cleanName,
    workerId: cleanId,
    role: role || 'General Field Staff',
    shiftType: shiftType || 'Standard Shift',
    hourlyRate: rate,
    checkInTime: new Date().toISOString(),
    checkOutTime: null,
    status: 'active',
    location: location || 'Main Facility Gate 1'
  };

  data.checkins.unshift(newCheckin);
  writeData(data);
  res.status(201).json({ message: 'Checked in successfully', checkin: newCheckin });
});

// GET all hazards
app.get('/api/hazards', (req, res) => {
  const data = readData();
  const sorted = [...(data.hazards || [])].sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
  res.json(sorted);
});

// POST new hazard report
app.post('/api/hazards', (req, res) => {
  const { reportedBy, workerId, category, severity, location, description } = req.body;

  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Hazard description is required' });
  }

  const data = readData();
  data.hazards = data.hazards || [];

  const newHazard = {
    id: `haz-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    reportedBy: (reportedBy && reportedBy.trim()) || 'Anonymous Worker',
    workerId: (workerId && workerId.trim()) || 'EMP-ANON',
    category: category || 'general',
    severity: severity || 'medium',
    location: (location && location.trim()) || 'Unspecified Location',
    description: description.trim(),
    status: 'open',
    reportedAt: new Date().toISOString(),
    resolvedAt: null,
    adminNotes: ''
  };

  data.hazards.unshift(newHazard);
  writeData(data);
  res.status(201).json({ message: 'Safety hazard report submitted', hazard: newHazard });
});

// PATCH update hazard status
app.patch('/api/hazards/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  const validStatuses = ['open', 'investigating', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const data = readData();
  data.hazards = data.hazards || [];
  const index = data.hazards.findIndex((h) => h.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Hazard report not found' });
  }

  const hazard = data.hazards[index];
  hazard.status = status;
  if (adminNotes !== undefined) {
    hazard.adminNotes = adminNotes;
  }
  if (status === 'resolved') {
    hazard.resolvedAt = new Date().toISOString();
  } else if (status === 'open' || status === 'investigating') {
    hazard.resolvedAt = null;
  }

  data.hazards[index] = hazard;
  writeData(data);
  res.json({ message: 'Hazard status updated', hazard });
});

// POST Reset / Seed Demo Data
app.post('/api/reset', (req, res) => {
  const fresh = resetDemoData();
  res.json({ message: 'Demo data reseeded successfully', data: fresh });
});

// Serve frontend build static files in production (if running standalone server)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Only start listening if run directly (not as a Vercel Serverless Function)
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`FairShift Server running on port ${PORT}`);
    console.log(`Serving API & Static assets from: ${distPath}`);
    console.log(`Ready: http://0.0.0.0:${PORT}`);
    console.log(`===============================================`);
  });
}

module.exports = app;
