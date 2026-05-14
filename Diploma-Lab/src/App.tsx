import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const FONTS = [
  { label: 'Clásica Cursiva',  value: 'TimesRomanBoldItalic', preview: 'Georgia, serif',           style: 'italic bold', file: null },
  { label: 'Formal',           value: 'TimesRoman',            preview: 'Georgia, serif',           style: 'normal',      file: null },
  { label: 'Formal Negrita',   value: 'TimesRomanBold',        preview: 'Georgia, serif',           style: 'bold',        file: null },
  { label: 'Formal Cursiva',   value: 'TimesRomanItalic',      preview: 'Georgia, serif',           style: 'italic',      file: null },
  { label: 'Moderna',          value: 'Helvetica',             preview: 'Arial, sans-serif',        style: 'normal',      file: null },
  { label: 'Moderna Negrita',  value: 'HelveticaBold',         preview: 'Arial, sans-serif',        style: 'bold',        file: null },
  { label: 'Great Vibes',      value: 'GreatVibes',            preview: 'Great Vibes, cursive',     style: 'normal',      file: '/fonts/GreatVibes-Regular.ttf' },
  { label: 'Pacifico',         value: 'Pacifico',              preview: 'Pacifico, cursive',        style: 'normal',      file: '/fonts/Pacifico-Regular.ttf' },
  { label: 'Sacramento',       value: 'Sacramento',            preview: 'Sacramento, cursive',      style: 'normal',      file: '/fonts/Sacramento-Regular.ttf' },
  { label: 'Satisfy',          value: 'Satisfy',               preview: 'Satisfy, cursive',         style: 'normal',      file: '/fonts/Satisfy-Regular.ttf' },
  { label: 'Kaushan Script',   value: 'KaushanScript',         preview: 'Kaushan Script, cursive',  style: 'normal',      file: '/fonts/KaushanScript-Regular.ttf' },
  { label: 'Allura',           value: 'Allura',                preview: 'Allura, cursive',          style: 'normal',      file: '/fonts/Allura-Regular.ttf' },
  { label: 'Pinyon Script',    value: 'PinyonScript',          preview: 'Pinyon Script, cursive',   style: 'normal',      file: '/fonts/PinyonScript-Regular.ttf' },
  { label: 'Lobster',          value: 'Lobster',               preview: 'Lobster, cursive',         style: 'normal',      file: '/fonts/Lobster-Regular.ttf' },
  { label: 'Mr Dafoe',         value: 'MrDafoe',               preview: 'Mr Dafoe, cursive',        style: 'normal',      file: '/fonts/MrDafoe-Regular.ttf' },
];

const COLORS = [
  '#0d1459','#1a237e','#1565c0','#0288d1','#00838f',
  '#7a1533','#b71c1c','#c62828','#ad1457','#6a1b9a',
  '#c8a84b','#f57f17','#e65100','#4e342e','#3e2723',
  '#1b5e20','#2e7d32','#388e3c','#00695c','#004d40',
  '#000000','#212121','#424242','#616161','#757575',
  '#ffffff','#fafafa','#f5f5f5','#fff8e1','#fce4ec',
  '#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3',
  '#00bcd4','#009688','#4caf50','#8bc34a','#cddc39',
  '#ffeb3b','#ffc107','#ff9800','#ff5722','#795548',
];

const fixAccents = (text: string) =>
  text.normalize('NFC')
    .replace(/á/g, '\u00E1').replace(/é/g, '\u00E9')
    .replace(/í/g, '\u00ED').replace(/ó/g, '\u00F3')
    .replace(/ú/g, '\u00FA').replace(/ü/g, '\u00FC')
    .replace(/ñ/g, '\u00F1').replace(/Á/g, '\u00C1')
    .replace(/É/g, '\u00C9').replace(/Í/g, '\u00CD')
    .replace(/Ó/g, '\u00D3').replace(/Ú/g, '\u00DA')
    .replace(/Ü/g, '\u00DC').replace(/Ñ/g, '\u00D1');

export default function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
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
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [textColor, setTextColor] = useState('#0d1459');
  const [customColor, setCustomColor] = useState('#0d1459');
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [pdfRealSize, setPdfRealSize] = useState({ width: 792, height: 612 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const pdfDocRef = useRef<any>(null);

  const previewName = students.length > 0 && nameCol
    ? String(students[0][nameCol])
    : 'Ana Sofía Ramírez Torres';

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Pacifico&family=Sacramento&family=Satisfy&family=Kaushan+Script&family=Allura&family=Pinyon+Script&family=Lobster&family=Mr+Dafoe&display=swap';
    document.head.appendChild(link);
  }, []);

  const renderPage = async () => {
    if (!pdfDocRef.current || !canvasRef.current) return;
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch {}
    }
    const page = await pdfDocRef.current.getPage(1);
    const canvas = canvasRef.current;
    const container = canvas.parentElement!;
    const viewport = page.getViewport({ scale: 1 });
    const scale = container.clientWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    setPdfRealSize({ width: viewport.width, height: viewport.height });
    const ctx = canvas.getContext('2d')!;
    const task = page.render({ canvasContext: ctx, viewport: scaledViewport });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (e: any) {
      if (e?.name === 'RenderingCancelledException') return;
    }
    const scaleX = canvas.width / viewport.width;
    const scaledFontSize = Math.max(fontSize * scaleX, 8);
    const posX = (nameX / 100) * canvas.width;
    const posY = canvas.height - (nameY / 100) * canvas.height;
    const isItalic = selectedFont.style.includes('italic');
    const isBold = selectedFont.style.includes('bold');
    ctx.font = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${scaledFontSize}px ${selectedFont.preview}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(previewName, posX, posY);
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(122,21,51,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, posY); ctx.lineTo(canvas.width, posY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(posX, 0); ctx.lineTo(posX, canvas.height); ctx.stroke();
    ctx.setLineDash([]);
  };

  const renderCanvas = async (file: File) => {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfDocRef.current = pdf;
      await renderPage();
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (pdfFile) renderCanvas(pdfFile); }, [pdfFile]);
  useEffect(() => { if (pdfDocRef.current) renderPage(); }, [nameX, nameY, fontSize, selectedFont, textColor, previewName]);

  const handlePDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPdfFile(f); setPdfName(f.name); setDone(false);
  };

  const handleExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setExcelName(f.name); setDone(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target?.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[];
      setStudents(data); setPreview(data.slice(0, 4));
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
    setError(''); setGenerating(true); setProgress(0); setDone(false);

    try {
      const pdfLib = await import('pdf-lib');
      const { PDFDocument, rgb, StandardFonts } = pdfLib;
      const fontkit = (await import('@pdf-lib/fontkit')).default;
      const JSZipLib = (await import('jszip')).default;
      const zip = new JSZipLib();
      const templateBytes = await pdfFile.arrayBuffer();
      const c = textColor.replace('#', '');
      const rgbColor = rgb(
        parseInt(c.slice(0,2),16)/255,
        parseInt(c.slice(2,4),16)/255,
        parseInt(c.slice(4,6),16)/255
      );

      const standardFontMap: Record<string, any> = {
        TimesRomanBoldItalic: StandardFonts.TimesRomanBoldItalic,
        TimesRoman: StandardFonts.TimesRoman,
        TimesRomanBold: StandardFonts.TimesRomanBold,
        TimesRomanItalic: StandardFonts.TimesRomanItalic,
        Helvetica: StandardFonts.Helvetica,
        HelveticaBold: StandardFonts.HelveticaBold,
      };

      // Cargar fuente TTF una sola vez
      let fontBytes: Uint8Array | null = null;
      if (selectedFont.file) {
        const res = await fetch(selectedFont.file);
        if (!res.ok) throw new Error(`No se pudo descargar la fuente ${selectedFont.label} (HTTP ${res.status})`);
        const buffer = await res.arrayBuffer();
        const view = new DataView(buffer);
        const magic = view.getUint32(0);
        if (magic !== 0x00010000 && magic !== 0x74727565 && magic !== 0x74746366 && magic !== 0x4F54544F) {
          throw new Error(`La fuente ${selectedFont.label} no es un TTF/OTF válido`);
        }
        fontBytes = new Uint8Array(buffer);
      }

      for (let i = 0; i < students.length; i++) {
        const rawName = String(students[i][nameCol] || '').trim();
        if (!rawName) continue;
        const safeName = fixAccents(rawName);

        const pdfDoc = await PDFDocument.load(templateBytes);
        let font;
        if (fontBytes) {
          pdfDoc.registerFontkit(fontkit);
          font = await pdfDoc.embedFont(fontBytes.slice());
        } else {
          font = await pdfDoc.embedFont(
            standardFontMap[selectedFont.value] || StandardFonts.TimesRomanBoldItalic
          );
        }

        const page = pdfDoc.getPages()[0];
        const { width: pdfW, height: pdfH } = page.getSize();
        const textWidth = font.widthOfTextAtSize(safeName, Number(fontSize));
        const realX = (Number(nameX) / 100) * pdfW - textWidth / 2;
        const realY = (Number(nameY) / 100) * pdfH;

        page.drawText(safeName, {
          x: realX, y: realY,
          size: Number(fontSize),
          font,
          color: rgbColor,
        });

        const pdfBytes2 = await pdfDoc.save();
        zip.file(`Diplomado_${rawName.replace(/\s+/g, '_')}.pdf`, pdfBytes2);
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
        .font-opt { cursor: pointer; transition: all 0.15s; }
        .font-opt:hover { background: #fdf5f7 !important; }
        .cdot { transition: all 0.15s; cursor: pointer; }
        .cdot:hover { transform: scale(1.3); }
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
          <p style={{ color: '#5a3a42', fontSize: '15px', lineHeight: 1.6 }}>Sube la plantilla y el listado para generar todos los diplomas en un ZIP.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: pdfFile ? '440px 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
          <div>
            {/* PDF */}
            <div style={card}>
              <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '14px', fontFamily: 'monospace', fontWeight: '700' }}>① PLANTILLA DEL DIPLOMADO (PDF)</div>
              <label style={{ display: 'block', border: `2px dashed ${pdfFile ? '#7a1533' : '#c4748a'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: pdfFile ? '#fdf0f3' : '#fffbfc' }}>
                <input type="file" accept=".pdf" onChange={handlePDF} style={{ display: 'none' }} />
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>📄</div>
                <div style={{ color: pdfFile ? '#7a1533' : '#9a6070', fontSize: '13px', fontWeight: pdfFile ? '700' : '400' }}>{pdfName || 'Haz clic para subir el PDF'}</div>
                {pdfFile && <div style={{ color: '#28a745', fontSize: '11px', marginTop: '4px', fontWeight: '700' }}>✓ {pdfRealSize.width.toFixed(0)}×{pdfRealSize.height.toFixed(0)} pts</div>}
              </label>
            </div>

            {/* Excel */}
            <div style={card}>
              <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '14px', fontFamily: 'monospace', fontWeight: '700' }}>② LISTA DE ESTUDIANTES (EXCEL)</div>
              <label style={{ display: 'block', border: `2px dashed ${students.length > 0 ? '#7a1533' : '#c4748a'}`, borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: students.length > 0 ? '#fdf0f3' : '#fffbfc' }}>
                <input type="file" accept=".xlsx,.xls" onChange={handleExcel} style={{ display: 'none' }} />
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>📊</div>
                <div style={{ color: students.length > 0 ? '#7a1533' : '#9a6070', fontSize: '13px', fontWeight: students.length > 0 ? '700' : '400' }}>{excelName || 'Haz clic para subir el Excel'}</div>
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

            {/* Fuente y Color */}
            <div style={card}>
              <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px', fontFamily: 'monospace', fontWeight: '700' }}>④ FUENTE Y COLOR</div>
              <label style={labelStyle}>TIPOGRAFÍA</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                {FONTS.map(font => (
                  <div key={font.value} className="font-opt" onClick={() => setSelectedFont(font)} style={{
                    padding: '10px 12px', borderRadius: '10px',
                    border: `2px solid ${selectedFont.value === font.value ? '#7a1533' : '#e8d0d6'}`,
                    background: selectedFont.value === font.value ? '#fdf0f3' : '#fff',
                  }}>
                    <div style={{ fontSize: '14px', fontFamily: font.preview, fontStyle: font.style.includes('italic') ? 'italic' : 'normal', fontWeight: font.style.includes('bold') ? 'bold' : 'normal', color: '#1a0a0e', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{font.label}</div>
                    <div style={{ fontSize: '11px', fontFamily: font.preview, fontStyle: font.style.includes('italic') ? 'italic' : 'normal', color: '#9a6070', marginTop: '2px' }}>Abc 123</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#fdf5f7', borderRadius: '10px', padding: '14px', marginBottom: '16px', textAlign: 'center', border: '1px solid #e8d0d6' }}>
                <div style={{ fontSize: '11px', color: '#9a6070', marginBottom: '8px', fontFamily: 'monospace' }}>VISTA PREVIA</div>
                <div style={{ fontSize: '20px', fontFamily: selectedFont.preview, fontStyle: selectedFont.style.includes('italic') ? 'italic' : 'normal', fontWeight: selectedFont.style.includes('bold') ? 'bold' : 'normal', color: textColor, wordBreak: 'break-word' }}>
                  {previewName}
                </div>
              </div>

              <label style={labelStyle}>COLOR DEL TEXTO</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: '#fdf5f7', borderRadius: '10px', border: '1px solid #e8d0d6', marginBottom: '14px' }}>
                {COLORS.map(color => (
                  <div key={color} className="cdot" onClick={() => { setTextColor(color); setCustomColor(color); }} style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: color,
                    border: textColor === color ? '3px solid #7a1533' : color === '#ffffff' ? '2px solid #ccc' : '2px solid transparent',
                    boxShadow: textColor === color ? '0 0 0 2px white, 0 0 0 4px #7a1533' : '0 1px 4px rgba(0,0,0,0.25)',
                  }} title={color} />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ ...labelStyle, marginBottom: '4px' }}>PERSONALIZADO</label>
                  <input type="color" value={customColor.length === 7 ? customColor : '#000000'} onChange={e => { setCustomColor(e.target.value); setTextColor(e.target.value); }}
                    style={{ width: '56px', height: '42px', border: '2px solid #c4748a', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, marginBottom: '4px' }}>HEX</label>
                  <input type="text" value={textColor} onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) { setTextColor(e.target.value); if (e.target.value.length === 7) setCustomColor(e.target.value); } }}
                    style={{ ...inp, padding: '8px 12px', fontFamily: 'monospace', fontSize: '13px' }} placeholder="#000000" />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#9a6070', marginBottom: '4px', fontFamily: 'monospace' }}>MUESTRA</div>
                  <div style={{ width: '48px', height: '42px', borderRadius: '8px', background: textColor, border: '2px solid #e8d0d6' }} />
                </div>
              </div>
            </div>

            {/* Posición */}
            <div style={card}>
              <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '16px', fontFamily: 'monospace', fontWeight: '700' }}>⑤ POSICIÓN DEL NOMBRE</div>
              <div style={{ background: '#fdf5f7', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#7a1533', lineHeight: 1.6 }}>
                💡 X e Y son porcentajes (0–100). Ve los cambios en tiempo real a la derecha.
              </div>
              {([
                { label: 'Posición X % (izquierda → derecha)', val: nameX, setter: setNameX, min: 0, max: 100 },
                { label: 'Posición Y % (abajo → arriba)', val: nameY, setter: setNameY, min: 0, max: 100 },
                { label: 'Tamaño de fuente (pts)', val: fontSize, setter: setFontSize, min: 8, max: 72 },
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
              {ready && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <span style={{ background: '#fdf5f7', border: '1px solid #e8d0d6', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: '#7a1533', fontFamily: 'monospace' }}>🔤 {selectedFont.label}</span>
                  <span style={{ background: textColor, border: '1px solid #e8d0d6', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: parseInt(textColor.replace('#',''), 16) > 0x888888 ? '#000' : '#fff', fontFamily: 'monospace' }}>🎨 {textColor}</span>
                  <span style={{ background: '#fdf5f7', border: '1px solid #e8d0d6', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', color: '#7a1533', fontFamily: 'monospace' }}>📏 {fontSize}pts</span>
                </div>
              )}
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

          {/* Canvas preview */}
          {pdfFile && (
            <div style={{ position: 'sticky', top: '24px' }}>
              <div style={card}>
                <div style={{ color: '#7a1533', fontSize: '12px', letterSpacing: '2px', marginBottom: '10px', fontFamily: 'monospace', fontWeight: '700' }}>👁 PREVISUALIZACIÓN EN TIEMPO REAL</div>
                <p style={{ color: '#5a3a42', fontSize: '12px', marginBottom: '12px', lineHeight: 1.5 }}>
                  Fuente, color y posición exactos a como quedará en el PDF.
                </p>
                <div style={{ borderRadius: '10px', overflow: 'hidden', border: '2px solid #e8d0d6', background: '#f0e0e4' }}>
                  <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
                </div>
                <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[['X', nameX + '%'], ['Y', nameY + '%'], ['Fuente', fontSize + 'pts']].map(([k, v]) => (
                    <span key={k} style={{ background: '#fdf5f7', border: '1px solid #e8d0d6', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: '#7a1533', fontFamily: 'monospace' }}>{k}: {v}</span>
                  ))}
                  <span style={{ background: textColor, border: '1px solid #e8d0d6', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', color: parseInt(textColor.replace('#',''), 16) > 0x888888 ? '#000' : '#fff', fontFamily: 'monospace' }}>
                    {selectedFont.label}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
