import { jsPDF } from 'jspdf'
import autoTable, { type Styles } from 'jspdf-autotable'
import type { DashboardSummary, Proposal, CloudCostItem } from '../api/client'
import type { SecurityCheck } from '../types/cloud'

type RGB = [number, number, number]

const colors: Record<string, RGB> = {
  ink: [20, 19, 19],
  title: [36, 32, 32],
  meta: [119, 113, 113],
  muted: [151, 144, 144],
  border: [226, 221, 221],
  soft: [251, 249, 252],
  white: [255, 255, 255],
  accent: [101, 120, 97],
  accentSoft: [237, 242, 234],
  warning: [138, 114, 84],
  warningSoft: [245, 240, 232],
}

function setText(doc: jsPDF, color: RGB) {
  doc.setTextColor(...color)
}

function setFill(doc: jsPDF, color: RGB) {
  doc.setFillColor(...color)
}

function setDraw(doc: jsPDF, color: RGB) {
  doc.setDrawColor(...color)
}

function drawLogo(doc: jsPDF, x: number, y: number) {
  setFill(doc, colors.accent)
  doc.roundedRect(x, y, 27, 27, 6, 6, 'F')
  setFill(doc, colors.white)
  doc.circle(x + 10, y + 14, 4.2, 'F')
  doc.circle(x + 16, y + 11.5, 5.2, 'F')
  doc.circle(x + 21, y + 15, 3.7, 'F')
  doc.roundedRect(x + 7, y + 14, 17, 6, 3, 3, 'F')
}

function drawHeader(doc: jsPDF, eyebrow: string, title: string, subtitle: string) {
  const width = doc.internal.pageSize.getWidth()
  setFill(doc, colors.ink)
  doc.rect(0, 0, width, 58, 'F')
  drawLogo(doc, 28, 15)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  setText(doc, colors.white)
  doc.text('CloudOps', 64, 25)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setText(doc, [190, 184, 184])
  doc.text('FOUNDATIONS', 64, 35)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setText(doc, [191, 209, 185])
  doc.text(eyebrow.toUpperCase(), width - 28, 24, { align: 'right' })
  doc.setFontSize(8)
  setText(doc, [190, 184, 184])
  doc.text(subtitle, width - 28, 35, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(23)
  setText(doc, colors.title)
  doc.text(title, 28, 86)
  setDraw(doc, colors.border)
  doc.setLineWidth(.6)
  doc.line(28, 96, width - 28, 96)
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  const height = doc.internal.pageSize.getHeight()
  const width = doc.internal.pageSize.getWidth()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    setDraw(doc, colors.border)
    doc.setLineWidth(.5)
    doc.line(28, height - 28, width - 28, height - 28)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, colors.muted)
    doc.text('CloudOps Foundations - Documento de planificación', 28, height - 16)
    doc.text(`Página ${page} de ${pageCount}`, width - 28, height - 16, { align: 'right' })
  }
}

function sectionTitle(doc: jsPDF, title: string, y: number, description?: string) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  setText(doc, colors.title)
  doc.text(title, 28, y)
  if (description) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    setText(doc, colors.meta)
    doc.text(description, 28, y + 13)
    return y + 26
  }
  return y + 18
}

function metricCards(doc: jsPDF, metrics: Array<{ label: string; value: string; detail?: string }>, y: number) {
  const width = doc.internal.pageSize.getWidth()
  const gap = 8
  const cardWidth = (width - 56 - gap * (metrics.length - 1)) / metrics.length
  metrics.forEach((metric, index) => {
    const x = 28 + index * (cardWidth + gap)
    setFill(doc, colors.soft)
    setDraw(doc, colors.border)
    doc.roundedRect(x, y, cardWidth, 48, 4, 4, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setText(doc, colors.meta)
    doc.text(metric.label, x + 10, y + 14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    setText(doc, colors.title)
    doc.text(metric.value, x + 10, y + 31)
    if (metric.detail) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      setText(doc, colors.muted)
      doc.text(metric.detail, x + 10, y + 41)
    }
  })
  return y + 62
}

function infoBox(doc: jsPDF, rows: Array<[string, string]>, y: number) {
  const width = doc.internal.pageSize.getWidth() - 56
  const rowHeight = 17
  setFill(doc, colors.white)
  setDraw(doc, colors.border)
  doc.roundedRect(28, y, width, rows.length * rowHeight + 12, 4, 4, 'FD')
  rows.forEach(([label, value], index) => {
    const rowY = y + 12 + index * rowHeight
    if (index > 0) {
      setDraw(doc, colors.border)
      doc.line(38, rowY - 9, 28 + width - 10, rowY - 9)
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    setText(doc, colors.meta)
    doc.text(label, 38, rowY)
    doc.setFont('helvetica', 'normal')
    setText(doc, colors.title)
    doc.text(value || 'Sin definir', 145, rowY)
  })
  return y + rows.length * rowHeight + 24
}

function addTable(doc: jsPDF, head: string[], body: string[][], y: number, widths?: Record<string, Partial<Styles>>) {
  autoTable(doc, {
    startY: y,
    head: [head],
    body,
    theme: 'grid',
    margin: { left: 28, right: 28, bottom: 38 },
    styles: { font: 'helvetica', fontSize: 8.2, cellPadding: 6, textColor: colors.title, lineColor: colors.border, lineWidth: .35 },
    headStyles: { fillColor: colors.ink, textColor: colors.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: colors.soft },
    columnStyles: widths,
  })
  return (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 30
}

function formatDate() {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long', timeStyle: 'short' }).format(new Date())
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

export function downloadDashboardPdf({ proposal, summary, proposalCount }: { proposal: Proposal; summary: DashboardSummary['summary']; proposalCount: number }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  drawHeader(doc, 'Reporte ejecutivo', 'Resumen de propuesta cloud', `Generado el ${formatDate()}`)
  let y = 116
  y = metricCards(doc, [
    { label: 'Costo mensual', value: formatMoney(summary.cost.monthlyTotal) },
    { label: 'Costo anual', value: formatMoney(summary.cost.annualTotal) },
    { label: 'Seguridad', value: `${summary.security.score}/100`, detail: summary.security.correctOf },
    { label: 'Planificaciones', value: String(proposalCount), detail: 'Guardadas en la cuenta' },
  ], y)
  y = sectionTitle(doc, 'Propuesta seleccionada', y, 'Contexto general de la arquitectura planificada.')
  y = infoBox(doc, [
    ['Nombre', proposal.solutionName],
    ['Tipo de aplicación', proposal.applicationType],
    ['Región principal', proposal.region],
    ['Usuarios estimados', proposal.users],
    ['Disponibilidad', proposal.availability],
    ['Ubicaciones', String(proposal.deploymentConfiguration.locations.length)],
  ], y)
  y = sectionTitle(doc, 'Distribución planificada', y, 'Ubicaciones, roles y capacidad de servidores.')
  y = addTable(doc, ['Ubicación', 'Rol', 'Servidores', 'Zonas', 'Ciudad / área'], proposal.deploymentConfiguration.locations.map((location) => [
    location.region,
    location.role === 'primary' ? 'Primaria' : location.role === 'backup' ? 'Respaldo' : 'Réplica',
    String(location.servers),
    String(location.availabilityZones),
    location.city || location.administrativeArea || 'Sin definir',
  ]), y, { 0: { cellWidth: 105 }, 1: { cellWidth: 80 }, 2: { cellWidth: 65 }, 3: { cellWidth: 50 } }) + 22
  y = sectionTitle(doc, 'Servicios incluidos', y, 'Componentes considerados dentro de la propuesta.')
  y = addTable(doc, ['Servicio', 'Categoría', 'Estado', 'Función principal'], summary.services.top.map((service) => [service.name, service.category, service.status, service.purpose]), y) + 22
  sectionTitle(doc, 'Controles de seguridad', y, 'Estado actual de los controles evaluados.')
  addTable(doc, ['Control', 'Estado', 'Detalle'], summary.security.checks.map((check: SecurityCheck) => [check.label, check.status, check.detail]), y + 26)
  footer(doc)
  doc.save(`reporte-cloudops-${proposal.id}.pdf`)
}

export function downloadCostsPdf({ proposal, items, monthlyTotal, annualTotal, budget, budgetPercent, usageHours }: { proposal: Proposal; items: CloudCostItem[]; monthlyTotal: number; annualTotal: number; budget: number; budgetPercent: number; usageHours: number }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  drawHeader(doc, 'Economía cloud', 'Estimación de costos', `Generado el ${formatDate()}`)
  let y = 116
  y = metricCards(doc, [
    { label: 'Total mensual', value: formatMoney(monthlyTotal) },
    { label: 'Proyección anual', value: formatMoney(annualTotal) },
    { label: 'Presupuesto', value: `${budgetPercent}%`, detail: `${formatMoney(monthlyTotal)} de ${formatMoney(budget)}` },
  ], y)
  y = sectionTitle(doc, 'Arquitectura cotizada', y, 'La estimación pertenece exclusivamente a la propuesta seleccionada.')
  y = infoBox(doc, [
    ['Nombre', proposal.solutionName],
    ['Tipo de aplicación', proposal.applicationType],
    ['Región principal', proposal.region],
    ['Ubicaciones', String(proposal.deploymentConfiguration.locations.length)],
    ['Horas mensuales', String(usageHours)],
    ['Modelo de disponibilidad', proposal.availability],
  ], y)
  y = sectionTitle(doc, 'Detalle de costos', y, 'Valores de referencia calculados por servicio.')
  y = addTable(doc, ['Servicio', 'Categoría', 'Cantidad', 'Horas', 'Mensual', 'Anual'], items.map((item) => [
    item.service,
    item.category,
    String(item.quantity),
    String(item.hours),
    formatMoney(item.monthly),
    formatMoney(item.annual),
  ]), y, { 0: { cellWidth: 105 }, 1: { cellWidth: 75 }, 2: { cellWidth: 55 }, 3: { cellWidth: 50 }, 4: { halign: 'right' }, 5: { halign: 'right' } }) + 24
  sectionTitle(doc, 'Notas de referencia', y)
  setFill(doc, colors.warningSoft)
  setDraw(doc, [223, 206, 176])
  doc.roundedRect(28, y + 8, doc.internal.pageSize.getWidth() - 56, 48, 4, 4, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  setText(doc, colors.warning)
  doc.text('Este reporte es una planificación de costos y no representa una factura real.', 40, y + 29)
  doc.text('Los precios deben validarse con el proveedor antes de una contratación.', 40, y + 43)
  footer(doc)
  doc.save(`reporte-costos-${proposal.id}.pdf`)
}
