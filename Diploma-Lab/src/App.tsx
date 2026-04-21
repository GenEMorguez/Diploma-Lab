import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfName, setPdfName] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [excelName, setExcelName] = useState('');
  const [nameCol, setNameCol] = useState('');
  const [workshopCol, setWorkshopCol] = useState('');
  const [hoursCol, setHoursCol] = useState('');
  const [dateCol, setDateCol] = useState('');
  const [nameX, setNameX] = useState(51);
  const [nameY, setNameY] = useState(52);
  const [fontSize, setFontSize] = useState(28);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [pdfRealSize, setPdfRealSize] = useState({ width: 792, height: 612 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const previewName = students.length > 0 && nameCol
    ? String(students[0][nameCol])
    : 'Ana Sofía Ramírez Torres';

  // Medir el contenedor del iframe para calcular escala real
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [pdfUrl]);

  // Escala real: cuántos px de pantalla = 1 pt del PDF
  const scaleX = containerSize.width / pdfRealSize.width;
  const scaleY = containerSize.height / pdfRealSize.height;
  // Fuente escalada para previsualización
  const previewFontSize = Math.round(fontSize * scaleX);

  const handlePDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPdfFile(f);
    setPdfName(f.name);
    setDone(false);
    setPdfUrl(URL.createObjectURL(f));

    // Leer tamaño real del PDF con pdf-lib
    try {
      const { PDFDocument } = await import('pdf-lib');
      const bytes = await f.arrayBuffer();
      const doc = await PDFDocument.load(bytes);
      const page = doc.getPages()[0];
      const { width, height } = page.getSize();
      setPdfRealSize({ width, height });
    } catch {
      setPdfRealSize({ width: 792, height: 612 });
    }
  };

  const handleExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setExcelName(f.name);
    setDone(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
      setStudents(data);
      setPreview(data.slice(0, 4));
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        keys.forEach(k => {
          const kl = k.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (kl.includes('nombre') || kl.includes('name')) setNameCol(k);
          if (kl.includes('taller') || kl.includes('curso')) setWorkshopCol(k);
          if (kl.includes('hora')) setHoursCol(k);
          if (kl.includes('fecha') || kl.includes('date')) setDateCol(k);
        });
      }
    };
    reader.readAsBinaryString(f);
  };

  const handleGenerateAll = async () => {
    if (!pdfFile) { setError('⚠️ Sube la plantilla PDF primero.'); return; }
    if (students.length === 0) { setError('⚠️ Sube el Excel primero.'); return; }
    if (!nameCol) { setError('⚠️ Selecciona la columna del nombre.'); return; }
    setError('');
    setGenerating(true);
    setProgress(0);
    setDone(false);
    try {
      const pdfLib = await import('pdf-lib');
      const { PDFDocument, rgb, StandardFonts } = pdfLib;
      const JSZipLib = (await import('jszip')).default;
      const zip = new JSZipLib();
      const templateBytes = await pdfFile.arrayBuffer();

      for (let i = 0; i < students.length; i++) {
        const name = String(students[i][nameCol] || '').trim();
        if (!name) continue;
        const pdfDoc = await PDFDocument.load(templateBytes);
        const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
        const page = pdfDoc.getPages()[0];
        const { width: pdfW, height: pdfH } = page.getSize();

        const textWidth = font.widthOfTextAtSize(name, Number(fontSize));
        // X centrado en porcentaje, Y en porcentaje desde abajo
        const realX = (Number(nameX) / 100) * pdfW - textWidth / 2;
        const realY = (Number(nameY) / 100) * pdfH;

        page.drawText(name, {
          x: realX,
          y: realY,
          size: Number(fontSize),
          font,
          color: rgb(0.05, 0.08, 0.35),
        });

        const pdfBytes = await pdfDoc.save();
        zip.file(`Diplomado_${name.replace(/\s+/g, '_')}.pdf`, pdfBytes);
        setProgress(Math.round(((i + 1) / students.length) * 100));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Diplomados_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e: any) {
      setError('Error: ' + e.message);
    }
    setGenerating(false);
  };

  const cols = students.length > 0 ? Object.keys(students[0]) : [];
  const ready = !!(pdfFile && students.length > 0);

  // Altura del iframe proporcional al PDF real
  const iframeHeight = containerSize.width > 0
    ? Math.round(containerSize.width * (pdfRealSize.height / pdfRealSize.width))
    : 420;

  const card: React.CSSProperties = { background: '#fff', border: '2px solid #e8d0d6', borderRadius: '16px', padding: '24px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(122,21,51,0.07)' };
  const labelStyle: React.CSSProperties = { display: 'block', color: '#5a3a42', fontSize: '13px', marginBottom: '6px', fontWeight: '700' };
  const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', background: '#fff', border: '2px solid #c4748a', borderRadius: '8px', padding: '10px 12px', color: '#1a0a0e', fontSize: '14px', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f0f2' }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus, select:focus { border-color: #7a1533 !important; box-shadow: 0 0 0 3px rgba(122,21,51,0.12); }
        button:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        button { transition: all 0.15s; }
        select option { background: #fff; color: #1a0a0e; }
        input[type=range] { accent-color: #7a1533; width: 100%; }
      `}</style>

      {/* Navbar */}
      <div style={{ background: '#fff', borderBottom: '3px solid #7a1533', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 12px rgba(122,21,51,0.1)' }}>
        <div style={{ width: '44px', height: '44px', background: '#7a1533', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🎓</div>
        <div>
          <div style={{ color: '#7a1533', fontSize: '20px', fontWeight: '700', fontFamily: 'Georgia, serif' }}>DiplomaGen</div>
          <div style={{ color: '#9a6070', fontSize: '10px', letterSpacing: '2px', fontFamily: 'monospace' }}>UAdeO · GENERADOR DE DIPLOMADOS</div>
        </div>
        {students.length > 0 && (
          <div style={{ marginLeft: 'auto', background: '#fdf5f7', border: '1px solid #e8d0d6', borderRadius: '20px', padding: '6px 14px', color: '#7a1533', fontSize: '12px', fontFamily: 'monospace', fontWeight: '700' }}>
            {students.length} estudiantes cargados
          </div>
        )}
      </div>

      <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px 60px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', color: '#1a0a0e', fontSize: '32px', marginBottom: '8px' }}>Panel del Docente</h1>
          <p style={{ color: '#5a3a42', fontSize: '15px', lineHeight: 1.6 }}>Sube la plantilla y el listado de estudiantes para generar todos los diplomas en un ZIP.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: pdfUrl ? '420px 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* Columna izquierda */}
          <div>
            {/* PDF */}
            <div style={card}>
              <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '14px', fontFamily: 'monospace', fontWeight: '700' }}>① PLANTILLA DEL DIPLOMADO (PDF)</div>
              <label style={{ display: 'block', border: `2px dashed ${pdfFile ? '#7a1533' : '#c4748a'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: pdfFile ? '#fdf0f3' : '#fffbfc' }}>
                <input type="file" accept=".pdf" onChange={handlePDF} style={{ display: 'none' }} />
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>📄</div>
                <div style={{ color: pdfFile ? '#7a1533' : '#9a6070', fontSize: '13px', fontWeight: pdfFile ? '700' : '400' }}>{pdfName || 'Haz clic para subir el PDF'}</div>
                {pdfFile && <div style={{ color: '#28a745', fontSize: '11px', marginTop: '4px', fontWeight: '700' }}>✓ Plantilla cargada — {pdfRealSize.width}×{pdfRealSize.height} pts</div>}
              </label>
            </div>

            {/* Excel */}
            <div style={card}>
              <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '14px', fontFamily: 'monospace', fontWeight: '700' }}>② LISTA DE ESTUDIANTES (EXCEL)</div>
              <label style={{ display: 'block', border: `2px dashed ${students.length > 0 ? '#7a1533' : '#c4748a'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: students.length > 0 ? '#fdf0f3' : '#fffbfc' }}>
                <input type="file" accept=".xlsx,.xls" onChange={handleExcel} style={{ display: 'none' }} />
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>📊</div>
                <div style={{ color: students.length > 0 ? '#7a1533' : '#9a6070', fontSize: '13px', fontWeight: students.length > 0 ? '700' : '400' }}>
                  {excelName || 'Haz clic para subir el Excel'}
                </div>
                {students.length > 0 && <div style={{ color: '#28a745', fontSize: '11px', marginTop: '4px', fontWeight: '700' }}>✓ {students.length} estudiantes</div>}
              </label>
              {preview.length > 0 && (
                <div style={{ marginTop: '12px', overflowX: 'auto', borderRadius: '8px', border: '1px solid #e8d0d6' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead><tr style={{ background: '#7a1533' }}>{cols.map(c => <th key={c} style={{ color: '#fff', padding: '8px 10px', textAlign: 'left', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c}</th>)}</tr></thead>
                    <tbody>{preview.map((row, i) => <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fdf5f7' }}>{cols.map(c => <td key={c} style={{ color: '#2d0a14', padding: '7px 10px', borderBottom: '1px solid #f0e0e4', whiteSpace: 'nowrap' }}>{String(row[c]).substring(0, 22)}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Mapeo */}
            {cols.length > 0 && (
              <div style={card}>
                <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '14px', fontFamily: 'monospace', fontWeight: '700' }}>③ MAPEO DE COLUMNAS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {([['NOMBRE', nameCol, setNameCol], ['TALLER', workshopCol, setWorkshopCol], ['HORAS', hoursCol, setHoursCol], ['FECHA', dateCol, setDateCol]] as [string, string, React.Dispatch<React.SetStateAction<string>>][]).map(([lbl, val, setter]) => (
                    <div key={lbl}>
                      <label style={labelStyle}>{lbl}</label>
                      <select style={{ ...inp, cursor: 'pointer' }} value={val} onChange={e => setter(e.target.value)}>
                        <option value="">-- seleccionar --</option>
                        {cols.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posición */}
            <div style={card}>
              <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px', fontFamily: 'monospace', fontWeight: '700' }}>④ POSICIÓN DEL NOMBRE</div>
              <div style={{ background: '#fdf5f7', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#7a1533', lineHeight: 1.6 }}>
                💡 X e Y son porcentajes (0–100). La previsualización muestra el nombre a escala real.
              </div>
              {([
                { label: 'Posición X % (izquierda → derecha)', val: nameX, setter: setNameX, min: 0, max: 100 },
                { label: 'Posición Y % (abajo → arriba)', val: nameY, setter: setNameY, min: 0, max: 100 },
                { label: 'Tamaño de fuente en PDF (pts)', val: fontSize, setter: setFontSize, min: 8, max: 72 },
              ] as { label: string; val: number; setter: React.Dispatch<React.SetStateAction<number>>; min: number; max: number }[]).map(({ label, val, setter, min, max }) => (
                <div key={label} style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={labelStyle}>{label}</label>
                    <span style={{ color: '#7a1533', fontFamily: 'monospace', fontSize: '13px', fontWeight: '700' }}>{val}</span>
                  </div>
                  <input type="range" min={min} max={max} value={val} onChange={e => setter(Number(e.target.value))} />
                  <input type="number" value={val} min={min} max={max} onChange={e => setter(Number(e.target.value))} style={{ ...inp, marginTop: '6px', padding: '8px 10px', fontSize: '13px' }} />
                </div>
              ))}
            </div>

            {error && <div style={{ color: '#9b1c2e', background: '#fde8ec', border: '1px solid #f5b8c4', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>{error}</div>}

            {/* Generar */}
            <div style={{ ...card, border: `2px solid ${ready ? '#7a1533' : '#e8d0d6'}` }}>
              <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '8px', fontFamily: 'monospace', fontWeight: '700' }}>⚡ GENERAR DIPLOMADOS</div>
              <p style={{ color: '#5a3a42', fontSize: '13px', marginBottom: '14px', lineHeight: 1.5 }}>
                {ready ? <><strong>{students.length} diplomados</strong> listos para generar en ZIP.</> : 'Sube el PDF y el Excel para continuar.'}
              </p>
              {generating && (
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#7a1533', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace' }}>Generando...</span>
                    <span style={{ color: '#7a1533', fontSize: '12px', fontWeight: '700', fontFamily: 'monospace' }}>{progress}%</span>
                  </div>
                  <div style={{ background: '#f0e0e4', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg,#7a1533,#c4748a)', height: '100%', width: `${progress}%`, borderRadius: '999px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ color: '#9a6070', fontSize: '11px', marginTop: '4px', fontFamily: 'monospace' }}>
                    {Math.round(progress * students.length / 100)} de {students.length} generados
                  </div>
                </div>
              )}
              {done && !generating && (
                <div style={{ background: '#edfaf3', border: '2px solid #28a745', borderRadius: '10px', padding: '12px', color: '#1a6b35', fontSize: '13px', fontWeight: '600', marginBottom: '12px', textAlign: 'center' }}>
                  ✅ ¡{students.length} diplomados generados!
                </div>
              )}
              <button onClick={handleGenerateAll} disabled={!ready || generating} style={{
                width: '100%', background: !ready ? '#d4a0aa' : generating ? '#c4748a' : '#7a1533',
                color: '#fff', border: 'none', borderRadius: '12px', padding: '16px',
                fontFamily: 'monospace', fontSize: '14px', fontWeight: '700',
                cursor: !ready || generating ? 'not-allowed' : 'pointer', letterSpacing: '2px',
                boxShadow: ready ? '0 4px 16px rgba(122,21,51,0.3)' : 'none'
              }}>
                {generating ? `⏳ GENERANDO ${progress}%...` : done ? '📦 GENERAR DE NUEVO' : `📦 GENERAR ZIP (${students.length || '?'} diplomados)`}
              </button>
            </div>
          </div>

          {/* Preview */}
          {pdfUrl && (
            <div style={{ position: 'sticky', top: '24px' }}>
              <div style={card}>
                <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '10px', fontFamily: 'monospace', fontWeight: '700' }}>👁 PREVISUALIZACIÓN EN TIEMPO REAL</div>
                <p style={{ color: '#5a3a42', fontSize: '12px', marginBottom: '12px', lineHeight: 1.5 }}>
                  El nombre en rojo muestra la posición y tamaño <strong>a escala real</strong> del PDF.
                </p>

                <div ref={containerRef} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e8d0d6' }}>
                  <iframe
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    style={{ width: '100%', height: `${iframeHeight}px`, border: 'none', display: 'block', pointerEvents: 'none' }}
                    title="Preview"
                  />
                  {/* Nombre superpuesto a escala real */}
                  <div style={{
                    position: 'absolute',
                    left: `${nameX}%`,
                    top: `${100 - nameY}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${previewFontSize}px`,
                    fontFamily: '"Times New Roman", serif',
                    fontStyle: 'italic',
                    fontWeight: 'bold',
                    color: 'rgba(180, 20, 50, 0.9)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                  }}>
                    {previewName}
                  </div>
                  {/* Cruz guía */}
                  <div style={{ position: 'absolute', left: 0, right: 0, top: `${100 - nameY}%`, height: '1px', background: 'rgba(180,20,50,0.35)', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${nameX}%`, width: '1px', background: 'rgba(180,20,50,0.35)', pointerEvents: 'none' }} />
                </div>

                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {[['X', nameX + '%'], ['Y', nameY + '%'], ['Fuente PDF', fontSize + 'pts'], ['Escala preview', previewFontSize + 'px']].map(([k, v]) => (
                    <span key={k} style={{ background: '#fdf5f7', border: '1px solid #e8d0d6', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: '#7a1533', fontFamily: 'monospace' }}>
                      {k}: {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
