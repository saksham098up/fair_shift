const fs = require('fs');
const path = require('path');
const os = require('os');

// On Vercel Serverless, file system is read-only except os.tmpdir()
const isVercel = !!process.env.VERCEL;
const DATA_FILE = isVercel
  ? path.join(os.tmpdir(), 'fairshift_data.json')
  : path.join(__dirname, 'data.json');

const INITIAL_CHECKINS = [
  {
    id: 'chk-101',
    workerName: 'Rajesh Kumar',
    workerId: 'EMP-4081',
    role: 'Forklift Operator',
    shiftType: 'Morning',
    hourlyRate: 350,
    checkInTime: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(),
    checkOutTime: null,
    status: 'active',
    location: 'Warehouse Bay 4',
    estimatedEarnings: 1225
  },
  {
    id: 'chk-102',
    workerName: 'Priya Sharma',
    workerId: 'EMP-3129',
    role: 'Assembly Technician',
    shiftType: 'Morning',
    hourlyRate: 300,
    checkInTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    checkOutTime: null,
    status: 'active',
    location: 'Assembly Line 2',
    estimatedEarnings: 1200
  },
  {
    id: 'chk-103',
    workerName: 'Amit Patel',
    workerId: 'EMP-1845',
    role: 'Quality Inspector',
    shiftType: 'Morning',
    hourlyRate: 320,
    checkInTime: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    checkOutTime: null,
    status: 'active',
    location: 'Inspection Station C',
    estimatedEarnings: 640
  },
  {
    id: 'chk-104',
    workerName: 'Sunita Verma',
    workerId: 'EMP-5920',
    role: 'Packaging Specialist',
    shiftType: 'Night',
    hourlyRate: 280,
    checkInTime: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    checkOutTime: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    status: 'completed',
    location: 'Packaging Line 1',
    hoursWorked: 8.0,
    earnings: 2240
  },
  {
    id: 'chk-105',
    workerName: 'Vikram Singh',
    workerId: 'EMP-2204',
    role: 'Maintenance Specialist',
    shiftType: 'Night',
    hourlyRate: 360,
    checkInTime: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
    checkOutTime: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    status: 'completed',
    location: 'Maintenance Shop 3',
    hoursWorked: 8.0,
    earnings: 2880
  }
];

const INITIAL_HAZARDS = [
  {
    id: 'haz-201',
    reportedBy: 'Rajesh Kumar',
    workerId: 'EMP-4081',
    category: 'slip_trip',
    severity: 'high',
    location: 'Aisle 7 near Loading Dock',
    description: 'Hydraulic oil puddle leaking from stationary pallet lifter. Significant slip hazard for workers.',
    status: 'open',
    reportedAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
    adminNotes: 'Awaiting cleanup crew dispatch.'
  },
  {
    id: 'haz-202',
    reportedBy: 'Amit Patel',
    workerId: 'EMP-1845',
    category: 'electrical',
    severity: 'critical',
    location: 'Conveyor Junction Box 12',
    description: 'Exposed wire casing with sparking visible during startup cycle. Immediate safety lockout recommended.',
    status: 'investigating',
    reportedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    adminNotes: 'Electrician dispatched with Lockout/Tagout protocol.'
  },
  {
    id: 'haz-203',
    reportedBy: 'Priya Sharma',
    workerId: 'EMP-3129',
    category: 'equipment',
    severity: 'low',
    location: 'Station 2 Safety Rail',
    description: 'Emergency stop guard latch is loose and rattles during heavy vibration.',
    status: 'resolved',
    reportedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    adminNotes: 'Latch tightened and safety inspected by Shift Supervisor.'
  }
];

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      writeData({ checkins: INITIAL_CHECKINS, hazards: INITIAL_HAZARDS });
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data file, using defaults', err);
    return { checkins: INITIAL_CHECKINS, hazards: INITIAL_HAZARDS };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing data file', err);
  }
}

function resetDemoData() {
  const fresh = {
    checkins: INITIAL_CHECKINS,
    hazards: INITIAL_HAZARDS
  };
  writeData(fresh);
  return fresh;
}

module.exports = {
  readData,
  writeData,
  resetDemoData
};
