function fmt12(t) {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function fmtDate(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

function buildRow(rec) {
  if (!rec) return { date: '', timeIn: '', timeOut: '', hours: '', sig: '' }
  return {
    date: fmtDate(rec.date),
    timeIn: fmt12(rec.time_in),
    timeOut: fmt12(rec.time_out),
    hours: rec.hours_rendered != null ? String(rec.hours_rendered) : '',
    sig: '',
  }
}

async function toDataUrl(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return url
  }
}

export async function printDTR({ profile, user, records, supervisor, academicYear, semester }) {
  const sup = supervisor || 'Mr. Mark Anthony Q. Pesigan'
  const ay = academicYear || '2025 - 2026'
  const sem = semester || '2nd'
  // Exclude absent records from the printed DTR
  const printable = records.filter(r => r.record_type !== 'absent')
  const left = printable.slice(0, 24)
  const right = printable.slice(24, 48)
  const rows = Array.from({ length: 24 }, (_, i) => ({
    l: buildRow(left[i]),
    r: buildRow(right[i]),
  }))

  const totalLeft = left.reduce((s, r) => s + (parseFloat(r.hours_rendered) || 0), 0)
  const totalRight = right.reduce((s, r) => s + (parseFloat(r.hours_rendered) || 0), 0)

  const meta = user?.user_metadata || {}
  const name = profile?.full_name || meta.full_name || ''
  const courseCode = profile?.course_code || meta.course_code || 'ITEC 199'
  const totalRequired = profile?.total_required_hours || meta.total_required_hours || 486
  const baseUrl = window.location.origin
  const [cvsuLogoSrc, bagongLogoSrc] = await Promise.all([
    toDataUrl(`${baseUrl}/cvsu-logo.png`),
    toDataUrl(`${baseUrl}/bagong-pilipinas-logo.png`),
  ])

  const rowsHtml = rows.map(({ l, r }) => `
    <tr>
      <td>${l.date}</td><td>${l.timeIn}</td><td>${l.timeOut}</td><td>${l.hours}</td><td>${l.sig}</td>
      <td>${r.date}</td><td>${r.timeIn}</td><td>${r.timeOut}</td><td>${r.hours}</td><td>${r.sig}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Daily Time Record - OJT</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:Arial,sans-serif; background:#fff; display:flex; justify-content:center; padding:20px; }
    .page { width:564px; background:#fff; padding:28px 36px 36px 36px; border:1px solid #ccc; }
    .header { display:flex; align-items:center; justify-content:space-between; padding-bottom:10px; border-bottom:1.5px solid #000; margin-bottom:8px; }
    .header-logo { width:80px; height:auto; }
    .header-center { text-align:center; flex:1; line-height:1.35; }
    .header-center .univ-name { font-size:15px; font-weight:bold; }
    .header-center .campus-name { font-size:14px; font-weight:bold; }
    .header-center .address, .header-center .phones, .header-center .website { font-size:11px; }
    .program-subtitle { text-align:center; font-size:13px; font-weight:bold; margin:8px 0 4px; }
    .form-title { text-align:center; font-size:15px; font-weight:bold; letter-spacing:0.5px; margin-bottom:10px; }
    .info-section { font-size:12px; margin-bottom:8px; line-height:1.7; }
    .info-row { display:flex; justify-content:space-between; align-items:baseline; }
    .info-row .left { flex:1; }
    .info-row .right { white-space:nowrap; padding-left:10px; }
    .info-label { font-weight:normal; }
    .info-value { font-weight:bold; }
    .semester-row { display:flex; gap:6px; align-items:center; font-size:12px; margin-top:2px; }
    .semester-row .ay { margin-left:auto; }
    .dtr-table-wrapper { width:100%; margin-bottom:6px; }
    .dtr-table { width:100%; border-collapse:collapse; font-size:11px; }
    .dtr-table th, .dtr-table td { border:1px solid #000; text-align:center; padding:2px 1px; height:16.5px; }
    .dtr-table th { font-weight:bold; font-size:10px; background:#fff; line-height:1.2; padding:2px 2px; }
    .dtr-table td { height:17px; }
    .col-date   { width:34px; }
    .col-timein { width:44px; }
    .col-timeout{ width:44px; }
    .col-hours  { width:34px; }
    .col-sig    { width:60px; }
    .totals-row { display:flex; justify-content:space-between; align-items:center; font-size:12px; margin:6px 0 14px; }
    .totals-row .total-block { display:flex; align-items:center; gap:6px; }
    .total-box { display:inline-block; min-width:40px; height:18px; border:1px solid #000; padding:0 4px; font-weight:bold; text-align:center; line-height:18px; }
    .attestation { font-size:12px; display:flex; gap:6px; align-items:flex-start; margin-top:4px; }
    .attestation .att-label { white-space:nowrap; }
    .attestation .att-signee { line-height:1.5; }
    .attestation .att-signee .att-name { font-weight:bold; }
    @media print {
      @page { size:A4 portrait; margin:12mm 20mm; }
      body { padding:0; background:#fff; display:flex; justify-content:center; }
      .page { border:none !important; width:490px; padding:0; box-shadow:none; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <img class="header-logo" src="${cvsuLogoSrc}" alt="CSU Logo"/>
    <div class="header-center">
      <div class="univ-name">CAVITE STATE UNIVERSITY</div>
      <div class="campus-name">Imus Campus</div>
      <div class="address">Cavite Civic Center Palico IV, Imus, Cavite</div>
      <div class="phones">(046) 471-66-07 / (046) 471-67-70/ (046) 686-2349</div>
      <div class="website">www.cvsu.edu.ph</div>
    </div>
    <img class="header-logo" src="${bagongLogoSrc}" alt="Bagong Pilipinas"/>
  </div>

  <div class="program-subtitle">On-the-Job Training (OJT) Program</div>
  <br/>
  <div class="form-title">DAILY TIME RECORD</div>

  <div class="info-section">
    <div class="info-row">
      <span class="left">
        <span class="info-label">Name: </span>
        <span class="info-value">${name}</span>
      </span>
      <span class="right">
        <span class="info-label">Program Code: </span>
        <span class="info-value">${courseCode}</span>
      </span>
    </div>
    <div>
      <span class="info-label">Total No. of Hours to be completed: </span>
      <span class="info-value">${totalRequired} Hours</span>
    </div>
    <div class="semester-row">
      <span>${sem === '1st' ? '( x )' : '(  )'} 1st Semester</span>
      <span>${sem === '2nd' ? '( x )' : '(  )'} 2nd Semester</span>
      <span>${sem === 'Summer' ? '( x )' : '(  )'} Summer</span>
      <span class="ay">
        <span class="info-label">Academic Year </span>
        <span class="info-value">${ay}</span>
      </span>
    </div>
  </div>

  <div class="dtr-table-wrapper">
    <table class="dtr-table">
      <colgroup>
        <col class="col-date"/><col class="col-timein"/><col class="col-timeout"/>
        <col class="col-hours"/><col class="col-sig"/>
        <col class="col-date"/><col class="col-timein"/><col class="col-timeout"/>
        <col class="col-hours"/><col class="col-sig"/>
      </colgroup>
      <thead>
        <tr>
          <th>Date</th><th>Time<br/>In</th><th>Time<br/>Out</th><th>Hours</th><th>Signature</th>
          <th>Date</th><th>Time<br/>In</th><th>Time<br/>Out</th><th>Hours</th><th>Signature</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>

  <div class="totals-row">
    <div class="total-block">
      <span>Total No. of Hours:</span>
      <span class="total-box">${totalLeft > 0 ? totalLeft.toFixed(0) : ''}</span>
    </div>
    <div class="total-block">
      <span>Total No. of Hours:</span>
      <span class="total-box">${totalRight > 0 ? totalRight.toFixed(0) : ''}</span>
    </div>
  </div>
  <br/>
  <div class="attestation">
    <span class="att-label">Attested by:</span>
    <div class="att-signee">
      <div class="att-name">${sup}</div>
      <div>Supervisor or Head of Host Agency</div>
      <div>(Signature Over Printed Name)</div>
    </div>
  </div>
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=700,height=900')
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    win.focus()
    win.print()
  }
}
