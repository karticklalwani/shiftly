'use client'
import { useState } from 'react'
import { C, Card, Btn, Select, Spinner } from '../ui'
import { getShifts } from '@/lib/actions/shifts.actions'
import { getEmployees } from '@/lib/actions/employees.actions'
import type { AppSession, ScheduleEvent } from '@/types'
import { hasRole } from '@/lib/auth'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function getMonday(offset = 0) {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7
  return new Date(new Date().setDate(diff)).toISOString().split('T')[0]
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function getDayName(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00')
  return DIAS[d.getDay()]
}

export default function PDFView({ session }: { session: AppSession }) {
  const isManager = hasRole(session.profile.role, 'manager')
  const [type, setType] = useState(isManager ? 'general' : 'individual')
  const [weekOffset, setWeekOffset] = useState(0)
  const [generating, setGenerating] = useState(false)

  const weekStart = getMonday(weekOffset)
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      // Importar jsPDF dinámicamente (solo client-side)
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const shiftsRes = await getShifts({
        week_start: weekStart,
        employee_id: type === 'individual' ? session.profile.id : undefined,
      })
      const shifts: ScheduleEvent[] = shiftsRes.data ?? []

      let employees: { id: string; name: string }[] = []
      if (isManager && type !== 'individual') {
        const empRes = await getEmployees()
        employees = (empRes.data ?? []).map(e => ({ id: e.id, name: e.full_name }))
      } else {
        employees = [{ id: session.profile.id, name: session.profile.full_name }]
      }

      const doc = new jsPDF({ orientation: type === 'individual' ? 'portrait' : 'landscape', unit: 'mm', format: 'a4' })

      // Header
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text(session.company.name, 14, 18)

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      const weekLabel = `Semana del ${new Date(weekStart + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`
      doc.text(weekLabel, 14, 26)
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 32)
      doc.setTextColor(0)

      if (type === 'individual') {
        // PDF individual: tabla vertical por día
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text(`Horario de ${session.profile.full_name}`, 14, 44)

        const rows = weekDates.map(date => {
          const shift = shifts.find(s => s.shift_date === date)
          if (!shift) return [getDayName(date), new Date(date + 'T12:00:00').toLocaleDateString('es-ES'), '—', '—', '—', '—', '—', '—']
          return [
            getDayName(date),
            new Date(date + 'T12:00:00').toLocaleDateString('es-ES'),
            shift.start_time,
            shift.end_time,
            `${shift.break_minutes} min`,
            `${shift.lunch_minutes} min`,
            `${shift.total_hours}h`,
            shift.status,
          ]
        })

        autoTable(doc, {
          startY: 50,
          head: [['Día', 'Fecha', 'Entrada', 'Salida', 'Descanso', 'Almuerzo', 'Total', 'Estado']],
          body: rows,
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 10, cellPadding: 4 },
        })

        // Total semanal
        const totalHours = shifts.reduce((a, s) => a + s.total_hours, 0)
        const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.text(`Total semanal: ${totalHours.toFixed(2)} horas`, 14, finalY)

      } else {
        // PDF general: grid empleados × días
        const head = ['Empleado', ...weekDates.map(d => `${getDayName(d)}\n${new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`), 'Total']
        const rows = employees.map(emp => {
          const empShifts = shifts.filter(s => s.employee_id === emp.id)
          const total = empShifts.reduce((a, s) => a + s.total_hours, 0)
          const dayCells = weekDates.map(date => {
            const s = empShifts.find(sh => sh.shift_date === date)
            return s ? `${s.start_time}–${s.end_time}\n${s.total_hours}h` : '—'
          })
          return [emp.name, ...dayCells, `${total.toFixed(1)}h`]
        })

        autoTable(doc, {
          startY: 40,
          head: [head],
          body: rows,
          theme: 'grid',
          headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 8, halign: 'center' },
          bodyStyles: { fontSize: 8, halign: 'center' },
          columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 35 } },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { cellPadding: 3, lineColor: [200, 210, 220] },
        })
      }

      // Firma
      const pageH = doc.internal.pageSize.height
      doc.setFontSize(9)
      doc.setTextColor(150)
      doc.text('Firma del responsable: _______________________________', 14, pageH - 14)
      doc.text(`Shiftly · ${session.company.name}`, doc.internal.pageSize.width - 14, pageH - 14, { align: 'right' })

      const filename = type === 'individual'
        ? `horario_${session.profile.full_name.replace(/ /g, '_')}_${weekStart}.pdf`
        : `horario_general_${weekStart}.pdf`

      doc.save(filename)
    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error al generar el PDF. Inténtalo de nuevo.')
    }
    setGenerating(false)
  }

  const PDF_TYPES = isManager
    ? [
        { value: 'general',    label: '👥 Horario general (todos los empleados)', desc: 'Tabla con todos los empleados y sus turnos de la semana' },
        { value: 'individual', label: '👤 Mi horario individual', desc: 'Tu propio horario semanal detallado' },
      ]
    : [
        { value: 'individual', label: '📅 Mi horario semanal', desc: 'Tu horario de la semana actual' },
      ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>Exportar PDF</h2>
        <p style={{ color: C.muted, marginTop: 4, fontSize: 13 }}>Genera documentos profesionales con el horario</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tipo de PDF */}
          <Card>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: C.text }}>Tipo de documento</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PDF_TYPES.map(t => (
                <div key={t.value} onClick={() => setType(t.value)}
                  style={{ padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    background: type === t.value ? C.accentDim : C.hi,
                    border: `1px solid ${type === t.value ? C.accent : C.border}`,
                    transition: 'all .15s' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Semana */}
          <Card>
            <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: C.text }}>Semana</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Btn variant="secondary" small onClick={() => setWeekOffset(w => w - 1)}>← Anterior</Btn>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {new Date(weekStart + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div style={{ fontSize: 11, color: C.muted }}>al {new Date(addDays(weekStart, 6) + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</div>
              </div>
              <Btn variant="secondary" small onClick={() => setWeekOffset(w => w + 1)}>Siguiente →</Btn>
            </div>
            <Btn variant="ghost" small style={{ marginTop: 8 }} onClick={() => setWeekOffset(0)}>Semana actual</Btn>
          </Card>
        </div>

        {/* Panel derecho: resumen + botón */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card style={{ background: `linear-gradient(135deg, ${C.accentDim}, ${C.hi})`, border: `1px solid ${C.accent}40` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              {PDF_TYPES.find(t => t.value === type)?.label}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 16 }}>
              Semana del {new Date(weekStart + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
              {' '}al {new Date(addDays(weekStart, 6) + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 20, lineHeight: 1.7 }}>
              ✓ Días completos (Domingo a Sábado)<br/>
              ✓ Entrada, salida, descanso y almuerzo<br/>
              ✓ Total de horas por empleado<br/>
              ✓ Firma del responsable<br/>
              ✓ Orientación {type === 'individual' ? 'vertical' : 'horizontal'} A4
            </div>
            <Btn onClick={handleGenerate} disabled={generating} style={{ width: '100%', padding: '12px', fontSize: 14 }}>
              {generating ? '⏳ Generando...' : '⬇ Descargar PDF'}
            </Btn>
          </Card>

          {/* Preview días de la semana */}
          <Card>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: C.text }}>Días incluidos</h3>
            {weekDates.map((date, i) => (
              <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '7px 0', borderBottom: i < 6 ? `1px solid ${C.border}20` : 'none' }}>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{getDayName(date)}</span>
                <span style={{ fontSize: 11, color: C.muted }}>{new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}
