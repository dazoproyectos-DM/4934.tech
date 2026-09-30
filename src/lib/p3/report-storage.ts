// P3 — Report Storage & History
// LocalStorage-based report archival

import type { ReportData } from '@/types/p3';

const STORAGE_KEY = 'p3_reports_history';
const MAX_STORED_REPORTS = 50;

export interface StoredReport {
  id: string;
  timestamp: string;
  projectName: string;
  projectCode: string;
  yacimiento: string;
  documentCount: number;
  totalHours: number;
  data: ReportData;
}

export function saveReport(report: ReportData): StoredReport {
  const id = generateId();
  const stored: StoredReport = {
    id,
    timestamp: new Date().toISOString(),
    projectName: report.projectName,
    projectCode: report.projectCode,
    yacimiento: report.yacimiento,
    documentCount: report.documents.length,
    totalHours: report.grandTotal,
    data: report,
  };

  try {
    const history = getHistory();
    history.unshift(stored);

    // Keep only MAX_STORED_REPORTS
    if (history.length > MAX_STORED_REPORTS) {
      history.splice(MAX_STORED_REPORTS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return stored;
  } catch {
    console.warn('Failed to save report to localStorage');
    return stored;
  }
}

export function getHistory(): StoredReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getReport(id: string): StoredReport | null {
  try {
    const history = getHistory();
    return history.find(r => r.id === id) || null;
  } catch {
    return null;
  }
}

export function deleteReport(id: string): boolean {
  try {
    const history = getHistory();
    const filtered = history.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

export function clearHistory(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
