// P3 — Export utilities (XLS, PDF, CSV, JSON)

import type { ReportData, DocumentHours } from '@/types/p3';
import { SPECIALTY_HOUR_KEYS, SPECIALTY_HOUR_LABELS } from '@/types/p3';

export interface ExportOptions {
  includeImages?: boolean;
  includeAnalysis?: boolean;
  template?: 'executive' | 'detailed' | 'technical';
}

// ---------------------------------------------------------------------------
// XLS export (already implemented in page.tsx)
// ---------------------------------------------------------------------------
export async function exportToXls(report: ReportData) {
  const XLSX = await import('xlsx');

  const header = [
    'DOCUMENTO Nro.',
    'DESCRIPCION',
    'ESPECIALIDAD',
    'REV.',
    'FORM',
    'HOJAS',
    'HS BASE',
    ...SPECIALTY_HOUR_KEYS.map(k => SPECIALTY_HOUR_LABELS[k]),
    'TOTAL HS',
  ];

  const dataRows = report.documents.map(d => [
    d.code,
    d.description,
    d.disciplineName,
    d.revision,
    d.format,
    d.sheets,
    d.baseHours,
    ...SPECIALTY_HOUR_KEYS.map(k => d.hours[k] || ''),
    d.totalHours,
  ]);

  const totalRow = [
    '', 'TOTAL HS POR ESPECIALIDAD', '', '', '', '',
    report.documents.reduce((s, d) => s + d.baseHours, 0),
    ...SPECIALTY_HOUR_KEYS.map(k => report.totals[k]),
    report.grandTotal,
  ];

  const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows, [], totalRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'HS ING - TOTALES PROY');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  XLSX.writeFile(wb, `Computo_Horas_${date}.xlsx`);
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------
export function exportToCsv(report: ReportData) {
  const lines: string[] = [];

  // Header
  lines.push('COMPUTO DE HORAS POR ESPECIALIDAD');
  lines.push(`Proyecto,${report.projectName}`);
  lines.push(`Código,${report.projectCode}`);
  lines.push(`Yacimiento,${report.yacimiento}`);
  lines.push(`Fecha,${report.date}`);
  lines.push('');

  // Documents table
  const header = [
    'DOCUMENTO',
    'DESCRIPCIÓN',
    'ESPECIALIDAD',
    'REV.',
    'HOJAS',
    'HS BASE',
    ...SPECIALTY_HOUR_KEYS.map(k => SPECIALTY_HOUR_LABELS[k]),
    'TOTAL',
  ];
  lines.push(header.map(h => `"${h}"`).join(','));

  for (const d of report.documents) {
    lines.push([
      `"${d.code}"`,
      `"${d.description}"`,
      d.disciplineName,
      d.revision,
      d.sheets,
      d.baseHours,
      ...SPECIALTY_HOUR_KEYS.map(k => d.hours[k] ?? 0),
      d.totalHours,
    ].join(','));
  }

  lines.push('');
  lines.push([
    '""',
    '"TOTAL HS POR ESPECIALIDAD"',
    '',
    '',
    '',
    report.documents.reduce((s, d) => s + d.baseHours, 0),
    ...SPECIALTY_HOUR_KEYS.map(k => report.totals[k]),
    report.grandTotal,
  ].join(','));

  // Discipline summary
  lines.push('');
  lines.push('RESUMEN POR ESPECIALIDAD');
  const disciplineGroups: Record<string, DocumentHours[]> = {};
  for (const d of report.documents) {
    if (!disciplineGroups[d.disciplineCode]) disciplineGroups[d.disciplineCode] = [];
    disciplineGroups[d.disciplineCode].push(d);
  }

  lines.push(['ESPECIALIDAD', 'DOCS', ...SPECIALTY_HOUR_KEYS.map(k => SPECIALTY_HOUR_LABELS[k]), 'TOTAL', '% INC.'].join(','));
  for (const [disc, docs] of Object.entries(disciplineGroups)) {
    const sub = docs.reduce(
      (acc, d) => {
        SPECIALTY_HOUR_KEYS.forEach(k => {
          acc[k] = (acc[k] ?? 0) + (d.hours[k] ?? 0);
        });
        return acc;
      },
      {} as Record<string, number>
    );
    const subTotal = SPECIALTY_HOUR_KEYS.reduce((s, k) => s + (sub[k] ?? 0), 0);
    lines.push([
      disc,
      docs.length,
      ...SPECIALTY_HOUR_KEYS.map(k => sub[k] ?? 0),
      subTotal,
      report.grandTotal > 0 ? ((subTotal / report.grandTotal) * 100).toFixed(1) + '%' : '—',
    ].join(','));
  }

  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Computo_Horas_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ---------------------------------------------------------------------------
// JSON export (for archiving and re-import)
// ---------------------------------------------------------------------------
export function exportToJson(report: ReportData) {
  const json = JSON.stringify(report, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `Computo_Horas_${new Date().toISOString().slice(0, 10)}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ---------------------------------------------------------------------------
// PDF export (using html2canvas + jsPDF)
// ---------------------------------------------------------------------------
export async function exportToPdf(report: ReportData, options: ExportOptions = {}) {
  try {
    const jsPDF = await import('jspdf');
    const html2canvas = await import('html2canvas');

    // Create a temporary container with the report HTML
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1200px';
    container.style.backgroundColor = '#fff';
    container.style.color = '#000';
    container.style.padding = '20px';
    container.innerHTML = generatePdfHtml(report, options.template ?? 'detailed');
    document.body.appendChild(container);

    try {
      const canvas = await html2canvas.default(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF.jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/png');
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`Computo_Horas_${date}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error al generar PDF. Intenta con otra opción de exportación.');
  }
}

// ---------------------------------------------------------------------------
// PDF HTML template
// ---------------------------------------------------------------------------
function generatePdfHtml(report: ReportData, template: string): string {
  const totalDocs = report.documents.length;
  const baseTotalHours = report.documents.reduce((s, d) => s + d.baseHours, 0);

  let html = `
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        h1 { color: #0066cc; font-size: 24px; margin-bottom: 5px; }
        h2 { color: #0066cc; font-size: 16px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #0066cc; padding-bottom: 5px; }
        .header { margin-bottom: 20px; }
        .metadata { font-size: 11px; color: #666; margin-bottom: 15px; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px; }
        th { background-color: #003366; color: white; padding: 8px; text-align: left; font-weight: bold; }
        td { padding: 6px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .section-header { background-color: #e6f0ff; font-weight: bold; color: #003366; }
        .total-row { background-color: #003366; color: white; font-weight: bold; }
        .number { text-align: right; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
        .summary-card { background-color: #f0f4f8; border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
        .summary-card-value { font-size: 18px; font-weight: bold; color: #0066cc; }
        .summary-card-label { font-size: 10px; color: #666; }
        .summary-card-pct { font-size: 12px; color: #666; margin-top: 3px; }
        .footer { margin-top: 20px; font-size: 10px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>COMPUTO DE HORAS POR ESPECIALIDAD</h1>
        <div class="metadata">
          <strong>Proyecto:</strong> ${report.projectName}<br/>
          <strong>Código:</strong> ${report.projectCode}<br/>
          <strong>Yacimiento:</strong> ${report.yacimiento}<br/>
          <strong>Fecha:</strong> ${report.date}
        </div>
      </div>
  `;

  if (template === 'executive' || template === 'detailed') {
    html += `
      <h2>RESUMEN EJECUTIVO</h2>
      <div class="metadata">
        <strong>Total de Documentos:</strong> ${totalDocs}<br/>
        <strong>Horas Base Totales:</strong> ${baseTotalHours}<br/>
        <strong>Horas Distribuidas:</strong> ${report.grandTotal.toFixed(1)}<br/>
        <strong>Promedio por Documento:</strong> ${(report.grandTotal / totalDocs).toFixed(1)} horas
      </div>

      <h2>DISTRIBUCIÓN POR ESPECIALIDAD</h2>
      <div class="summary-grid">
        ${SPECIALTY_HOUR_KEYS.map(k => {
          const hrs = report.totals[k];
          const pct = report.grandTotal > 0 ? ((hrs / report.grandTotal) * 100).toFixed(1) : '0';
          return `
            <div class="summary-card">
              <div class="summary-card-label">${SPECIALTY_HOUR_LABELS[k]}</div>
              <div class="summary-card-value">${hrs.toFixed(1)}</div>
              <div class="summary-card-pct">${pct}%</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  if (template === 'detailed' || template === 'technical') {
    html += `
      <h2>DETALLE DE DOCUMENTOS</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">DOCUMENTO</th>
            <th style="width: 25%;">DESCRIPCIÓN</th>
            <th style="width: 10%;">ESP.</th>
            <th style="width: 8%;" class="number">HS BASE</th>
            <th style="width: 5%;" class="number">PS E/I</th>
            <th style="width: 5%;" class="number">PS M/P</th>
            <th style="width: 5%;" class="number">PS C/S</th>
            <th style="width: 5%;" class="number">PJ E/I</th>
            <th style="width: 5%;" class="number">CAD</th>
            <th style="width: 7%;" class="number">TOTAL</th>
          </tr>
        </thead>
        <tbody>
    `;

    let lastDisc = '';
    for (const doc of report.documents) {
      if (doc.disciplineCode !== lastDisc) {
        if (lastDisc) {
          html += '<tr style="height: 8px;"></tr>';
        }
        html += `<tr class="section-header"><td colspan="10">${doc.disciplineName}</td></tr>`;
        lastDisc = doc.disciplineCode;
      }

      html += `
        <tr>
          <td style="font-family: monospace;">${doc.code}</td>
          <td>${doc.description}</td>
          <td>${doc.disciplineCode}-${doc.typeCode}</td>
          <td class="number">${doc.baseHours}</td>
          <td class="number">${doc.hours.psEIPr.toFixed(1)}</td>
          <td class="number">${doc.hours.psMp.toFixed(1)}</td>
          <td class="number">${doc.hours.psCs.toFixed(1)}</td>
          <td class="number">${doc.hours.pjEIPr.toFixed(1)}</td>
          <td class="number">${doc.hours.cad.toFixed(1)}</td>
          <td class="number"><strong>${doc.totalHours.toFixed(1)}</strong></td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>

      <table>
        <thead>
          <tr class="total-row">
            <th style="width: 45%;">TOTAL HORAS POR ESPECIALIDAD — ING. DETALLE</th>
            <th style="width: 8%;" class="number">HS BASE</th>
            <th style="width: 5%;" class="number">PS E/I</th>
            <th style="width: 5%;" class="number">PS M/P</th>
            <th style="width: 5%;" class="number">PS C/S</th>
            <th style="width: 5%;" class="number">PJ E/I</th>
            <th style="width: 5%;" class="number">CAD</th>
            <th style="width: 7%;" class="number">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr class="total-row">
            <td></td>
            <td class="number">${baseTotalHours}</td>
            <td class="number">${report.totals.psEIPr.toFixed(1)}</td>
            <td class="number">${report.totals.psMp.toFixed(1)}</td>
            <td class="number">${report.totals.psCs.toFixed(1)}</td>
            <td class="number">${report.totals.pjEIPr.toFixed(1)}</td>
            <td class="number">${report.totals.cad.toFixed(1)}</td>
            <td class="number">${report.grandTotal.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  html += `
      <div class="footer">
        Generado automáticamente • P3 — Computo de Horas por Especialidad
      </div>
    </body>
    </html>
  `;

  return html;
}
