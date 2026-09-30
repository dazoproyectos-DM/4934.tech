// P3 — Action Plan Generator
// Generates resource allocation plans based on hours distribution

import type { ReportData } from '@/types/p3';
import { SPECIALTY_HOUR_LABELS } from '@/types/p3';

export interface ActionItem {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  action: string;
  rationale: string;
  impact: string;
}

export interface ActionPlan {
  projectName: string;
  projectCode: string;
  generatedDate: string;
  totalHours: number;
  totalDocuments: number;
  bottlenecks: ActionItem[];
  resourceAllocation: ActionItem[];
  timeline: ActionItem[];
  recommendations: ActionItem[];
}

export function generateActionPlan(report: ReportData): ActionPlan {
  // Analyze bottlenecks
  const bottlenecks = findBottlenecks(report);
  const resourceAllocations = generateResourceAllocation(report);
  const timeline = generateTimeline(report);
  const recommendations = generateRecommendations(report);

  return {
    projectName: report.projectName,
    projectCode: report.projectCode,
    generatedDate: report.date,
    totalHours: report.grandTotal,
    totalDocuments: report.documents.length,
    bottlenecks,
    resourceAllocation: resourceAllocations,
    timeline,
    recommendations,
  };
}

function findBottlenecks(report: ReportData): ActionItem[] {
  const items: ActionItem[] = [];

  // Find most heavily used specialties
  const specialtyUsage = [
    { spec: 'psEIPr', hours: report.totals.psEIPr, label: SPECIALTY_HOUR_LABELS.psEIPr },
    { spec: 'psMp', hours: report.totals.psMp, label: SPECIALTY_HOUR_LABELS.psMp },
    { spec: 'psCs', hours: report.totals.psCs, label: SPECIALTY_HOUR_LABELS.psCs },
    { spec: 'pjEIPr', hours: report.totals.pjEIPr, label: SPECIALTY_HOUR_LABELS.pjEIPr },
    { spec: 'pjMp', hours: report.totals.pjMp, label: SPECIALTY_HOUR_LABELS.pjMp },
    { spec: 'pjCs', hours: report.totals.pjCs, label: SPECIALTY_HOUR_LABELS.pjCs },
    { spec: 'cad', hours: report.totals.cad, label: SPECIALTY_HOUR_LABELS.cad },
    { spec: 'maqueta', hours: report.totals.maqueta, label: SPECIALTY_HOUR_LABELS.maqueta },
  ].sort((a, b) => b.hours - a.hours);

  // Top 3 are bottlenecks
  for (let i = 0; i < Math.min(3, specialtyUsage.length); i++) {
    const usage = specialtyUsage[i];
    if (usage.hours > 0) {
      items.push({
        priority: i === 0 ? 'HIGH' : i === 1 ? 'MEDIUM' : 'LOW',
        category: 'Bottleneck Identification',
        action: `Allocate dedicated resources for ${usage.label}`,
        rationale: `${usage.label} requires ${usage.hours.toFixed(1)} hours (${((usage.hours / report.grandTotal) * 100).toFixed(1)}% of total)`,
        impact: `Prevents delays in ${getAffectedDisciplines(report, usage.spec).join(', ')} deliverables`,
      });
    }
  }

  return items;
}

function getAffectedDisciplines(report: ReportData, spec: string): string[] {
  const disciplines = new Set<string>();
  for (const doc of report.documents) {
    const hours = doc.hours[spec as keyof typeof doc.hours];
    if (hours && hours > 0) {
      disciplines.add(doc.disciplineName);
    }
  }
  return Array.from(disciplines);
}

function generateResourceAllocation(report: ReportData): ActionItem[] {
  const items: ActionItem[] = [];
  const avgHoursPerDoc = report.grandTotal / report.documents.length;

  // Assign resources based on hours distribution
  const specialties = [
    { spec: 'psEIPr', label: 'Senior Piping Engineer' },
    { spec: 'psMp', label: 'Mid-level Piping Engineer' },
    { spec: 'psCs', label: 'Junior Piping Engineer' },
    { spec: 'cad', label: 'CAD Technician' },
  ];

  for (const { spec, label } of specialties) {
    const hours = report.totals[spec as keyof typeof report.totals];
    if (hours > 0) {
      const daysRequired = Math.ceil(hours / 8);
      items.push({
        priority: hours > avgHoursPerDoc * 1.5 ? 'HIGH' : 'MEDIUM',
        category: 'Resource Assignment',
        action: `Dedicate ${label} for ${daysRequired} working days`,
        rationale: `Total hours allocated: ${hours.toFixed(1)} (equivalent to ${daysRequired} 8-hour days)`,
        impact: `Ensures timely delivery of all ${spec} documents and maintains quality standards`,
      });
    }
  }

  return items;
}

function generateTimeline(report: ReportData): ActionItem[] {
  const items: ActionItem[] = [];
  const totalDays = Math.ceil(report.grandTotal / 8 / 1.2); // 1.2 factor for overhead
  const weeksRequired = Math.ceil(totalDays / 5);

  items.push({
    priority: 'HIGH',
    category: 'Schedule Planning',
    action: `Plan ${weeksRequired} weeks for project completion`,
    rationale: `Based on ${report.grandTotal.toFixed(1)} total hours distributed across ${report.documents.length} documents`,
    impact: 'Prevents unrealistic deadlines and ensures proper quality control',
  });

  // Phase 1: Critical path items
  const criticalDocs = report.documents
    .filter(d => d.totalHours > report.grandTotal * 0.05) // >5% of total
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 3);

  if (criticalDocs.length > 0) {
    items.push({
      priority: 'HIGH',
      category: 'Critical Path',
      action: 'Complete critical documents in Phase 1 (Weeks 1-2)',
      rationale: `Priority documents: ${criticalDocs.map(d => d.code).join(', ')}`,
      impact: 'Unblocks downstream activities and allows parallel processing',
    });
  }

  return items;
}

function generateRecommendations(report: ReportData): ActionItem[] {
  const items: ActionItem[] = [];

  // Recommendation 1: Quality gates
  items.push({
    priority: 'HIGH',
    category: 'Quality Assurance',
    action: 'Implement review gates at 50% and 100% completion',
    rationale: 'Ensures consistency and catches issues early in the delivery cycle',
    impact: 'Reduces rework and maintains professional standards across all deliverables',
  });

  // Recommendation 2: Risk mitigation
  items.push({
    priority: 'MEDIUM',
    category: 'Risk Mitigation',
    action: 'Allocate 15% buffer hours for technical reviews and revisions',
    rationale: `Current allocation: ${report.grandTotal.toFixed(1)} hours. Recommended buffer: ${(report.grandTotal * 0.15).toFixed(1)} hours`,
    impact: 'Handles unexpected complexity and revision requests without delaying delivery',
  });

  // Recommendation 3: Documentation
  items.push({
    priority: 'MEDIUM',
    category: 'Documentation',
    action: 'Create deliverable checklist and tracking spreadsheet',
    rationale: `${report.documents.length} documents require coordination and tracking`,
    impact: 'Improves visibility and enables early identification of delays',
  });

  // Recommendation 4: Communication
  items.push({
    priority: 'LOW',
    category: 'Communication',
    action: 'Schedule weekly status meetings with stakeholders',
    rationale: 'Multi-discipline project with ${report.documents.length} deliverables',
    impact: 'Maintains alignment and manages expectations throughout the project',
  });

  return items;
}
