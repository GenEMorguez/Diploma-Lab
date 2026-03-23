import React, { useState } from "react";
import * as XLSX from "xlsx";
import JSZip from "jszip";

export default function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const [students, setStudents] = useState([]);
  const [excelName, setExcelName] = useState("");
  const [nameCol, setNameCol] = useState("");
  const [workshopCol, setWorkshopCol] = useState("");
  const [hoursCol, setHoursCol] = useState("");
  const [dateCol, setDateCol] = useState("");
  const [nameX, setNameX] = useState(406);
  const [nameY, setNameY] = useState(300);
  const [fontSize, setFontSize] = useState(32);
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handlePDF = (e) => {
    const f = e.target.files[0];
    if (f) { setPdfFile(f); setPdfName(f.name); setDone(false); }
  };

  const handleExcel = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setExcelName(f.name);
    setDone(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
      setStudents(data);
      setPreview(data.slice(0, 4));
      if (data.length > 0) {
        const keys = Object.keys(data[0]);
        keys.forEach(k => {
          const kl = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (kl.includes("nombre") || kl.includes("name")) setNameCol(k);
          if (kl.includes("taller") || kl.includes("curso") || kl.includes("actividad")) setWorkshopCol(k);
          if (kl.includes("hora")) setHoursCol(k);
          if (kl.includes("fecha") || kl.includes("date")) setDateCol(k);
        });
      }
    };
    reader.readAsBinaryString(f);
  };

  const handleGenerateAll = async () => {
    if (!pdfFile) { setError("⚠️ Sube la plantilla PDF primero."); return; }
    if (students.length === 0) { setError("⚠️ Sube el Excel con estudiantes primero."); return; }
    if (!nameCol) { setError("⚠️ Selecciona la columna del nombre."); return; }
    setError("");
    setGenerating(true);
    setProgress(0);
    setDone(false);
    try {
      const pdfLib = await import("pdf-lib");
      const { PDFDocument, rgb, StandardFonts } = pdfLib;
      const JSZipLib = (await import("jszip")).default;
      const zip = new JSZipLib();
      const templateBytes = await pdfFile.arrayBuffer();
      for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const name = String(s[nameCol] || "").trim();
        if (!name) continue;
        const pdfDoc = await PDFDocument.load(templateBytes);
        const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
        const page = pdfDoc.getPages()[0];
        const textWidth = font.widthOfTextAtSize(name, Number(fontSize));
        page.drawText(name, {
          x: Number(nameX) - textWidth / 2,
          y: Number(nameY),
          size: Number(fontSize),
          font,
          color: rgb(0.05, 0.08, 0.35),
        });
        const pdfBytes = await pdfDoc.save();
        zip.file(`Diplomado_${name.replace(/\s+/g, "_")}.pdf`, pdfBytes);
        setProgress(Math.round(((i + 1) / students.length) * 100));
      }
      const zipBlob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Diplomados_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      setError("Error al generar: " + e.message);
    }
    setGenerating(false);
  };

  const cols = students.length > 0 ? Object.keys(students[0]) : [];
  const ready = pdfFile && students.length > 0;

  const card = { background: "#fff", border: "2px solid #e8d0d6", borderRadius: "16px", padding: "24px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(122,21,51,0.07)" };
  const label = { display: "block", color: "#5a3a42", fontSize: "13px", marginBottom: "6px", fontWeight: "700" };
  const inp = { width: "100%", boxSizing: "border-box", background: "#fff", border: "2px solid #c4748a", borderRadius: "8px", padding: "10px 12px", color: "#1a0a0e", fontSize: "14px", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f0f2" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input::placeholder { color: #c4a0aa; }
        input:focus, select:focus { border-color: #7a1533 !important; box-shadow: 0 0 0 3px rgba(122,21,51,0.12); }
        button:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
        button { transition: all 0.15s; }
        select option { background: #fff; color: #1a0a0e; }
      `}</style>

      {/* Navbar */}
      <div style={{ background: "#fff", borderBottom: "3px solid #7a1533", padding: "16px 32px", display: "flex", alignItems: "center", gap: "14px", boxShadow: "0 2px 12px rgba(122,21,51,0.1)" }}>
        <div style={{ width: "44px", height: "44px", background: "#7a1533", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>🎓</div>
        <div>
          <div style={{ color: "#7a1533", fontSize: "20px", fontWeight: "700", fontFamily: "Georgia, serif" }}>DiplomaGen</div>
          <div style={{ color: "#9a6070", fontSize: "10px", letterSpacing: "2px", fontFamily: "monospace" }}>UAdeO · GENERADOR DE DIPLOMADOS</div>
        </div>
        {students.length > 0 && (
          <div style={{ marginLeft: "auto", background: "#fdf5f7", border: "1px solid #e8d0d6", borderRadius: "20px", padding: "6px 14px", color: "#7a1533", fontSize: "12px", fontFamily: "monospace", fontWeight: "700" }}>
            {students.length} estudiantes cargados
          </div>
        )}
      </div>

      <div style={{ maxWidth: "700px", margin: "40px auto", padding: "0 24px 60px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontFamily: "Georgia, serif", color: "#1a0a0e", fontSize: "32px", marginBottom: "8px" }}>Panel del Docente</h1>
          <p style={{ color: "#5a3a42", fontSize: "15px", lineHeight: 1.6 }}>Sube la plantilla del diplomado y el listado de estudiantes para generar todos los diplomas en un solo archivo ZIP.</p>
        </div>

        {/* Paso 1 - PDF */}
        <div style={card}>
          <div style={{ color: "#7a1533", fontSize: "12px", letterSpacing: "2px", marginBottom: "14px", fontFamily: "monospace", fontWeight: "700" }}>① PLANTILLA DEL DIPLOMADO (PDF)</div>
          <label style={{ display: "block", border: `2px dashed ${pdfFile ? "#7a1533" : "#c4748a"}`, borderRadius: "12px", padding: "24px", textAlign: "center", cursor: "pointer", background: pdfFile ? "#fdf0f3" : "#fffbfc", transition: "all 0.2s" }}>
            <input type="file" accept=".pdf" onChange={handlePDF} style={{ display: "none" }} />
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📄</div>
            <div style={{ color: pdfFile ? "#7a1533" : "#9a6070", fontSize: "14px", fontWeight: pdfFile ? "700" : "400" }}>
              {pdfName || "Haz clic para subir la plantilla PDF"}
            </div>
            {pdfFile && <div style={{ color: "#28a745", fontSize: "12px", marginTop: "6px", fontWeight: "700" }}>✓ Plantilla cargada correctamente</div>}
          </label>
        </div>

        {/* Paso 2 - Excel */}
        <div style={card}>
          <div style={{ color: "#7a1533", fontSize: "12px", letterSpacing: "2px", marginBottom: "14px", fontFamily: "monospace", fontWeight: "700" }}>② LISTA DE ESTUDIANTES (EXCEL)</div>
          <label style={{ display: "block", border: `2px dashed ${students.length > 0 ? "#7a1533" : "#c4748a"}`, borderRadius: "12px", padding: "24px", textAlign: "center", cursor: "pointer", background: students.length > 0 ? "#fdf0f3" : "#fffbfc", transition: "all 0.2s" }}>
            <input type="file" accept=".xlsx,.xls" onChange={handleExcel} style={{ display: "none" }} />
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📊</div>
            <div style={{ color: students.length > 0 ? "#7a1533" : "#9a6070", fontSize: "14px", fontWeight: students.length > 0 ? "700" : "400" }}>
              {excelName || "Haz clic para subir el archivo Excel"}
            </div>
            {students.length > 0 && <div style={{ color: "#28a745", fontSize: "12px", marginTop: "6px", fontWeight: "700" }}>✓ {students.length} estudiantes encontrados</div>}
          </label>
          {preview.length > 0 && (
            <div style={{ marginTop: "16px", overflowX: "auto", borderRadius: "10px", border: "1px solid #e8d0d6" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ background: "#7a1533" }}>
                    {cols.map(c => <th key={c} style={{ color: "#fff", padding: "10px 12px", textAlign: "left", fontFamily: "monospace", fontSize: "11px", whiteSpace: "nowrap" }}>{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fdf5f7" }}>
                      {cols.map(c => <td key={c} style={{ color: "#2d0a14", padding: "9px 12px", borderBottom: "1px solid #f0e0e4", fontSize: "12px", whiteSpace: "nowrap" }}>{String(row[c]).substring(0, 28)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paso 3 - Mapeo */}
        {cols.length > 0 && (
          <div style={card}>
            <div style={{ color: "#7a1533", fontSize: "12px", letterSpacing: "2px", marginBottom: "18px", fontFamily: "monospace", fontWeight: "700" }}>③ MAPEO DE COLUMNAS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[["NOMBRE DEL ALUMNO", nameCol, setNameCol], ["NOMBRE DEL TALLER", workshopCol, setWorkshopCol], ["HORAS", hoursCol, setHoursCol], ["FECHA", dateCol, setDateCol]].map(([lbl, val, setter]) => (
                <div key={lbl}>
                  <label style={label}>{lbl}</label>
                  <select style={{ ...inp, cursor: "pointer" }} value={val} onChange={e => setter(e.target.value)}>
                    <option value="">-- seleccionar --</option>
                    {cols.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paso 4 - Posición */}
        <div style={card}>
          <div style={{ color: "#7a1533", fontSize: "12px", letterSpacing: "2px", marginBottom: "18px", fontFamily: "monospace", fontWeight: "700" }}>④ POSICIÓN DEL NOMBRE EN EL PDF</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            {[["Posición X", nameX, setNameX], ["Posición Y", nameY, setNameY], ["Tamaño fuente", fontSize, setFontSize]].map(([lbl, val, setter]) => (
              <div key={lbl}>
                <label style={label}>{lbl}</label>
                <input type="number" style={inp} value={val} onChange={e => setter(e.target.value)} />
              </div>
            ))}
          </div>
          <div style={{ color: "#9a6070", fontSize: "12px", marginTop: "12px", background: "#fdf5f7", padding: "10px 14px", borderRadius: "8px", lineHeight: 1.6 }}>
            💡 Valores recomendados para la plantilla UAdeO: <strong>X: 406, Y: 300, Fuente: 32</strong>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: "#9b1c2e", background: "#fde8ec", border: "1px solid #f5b8c4", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px", fontSize: "14px", fontWeight: "600" }}>
            {error}
          </div>
        )}

        {/* Botón generar ZIP */}
        <div style={{ ...card, border: `2px solid ${ready ? "#7a1533" : "#e8d0d6"}`, background: ready ? "#fff" : "#fafafa" }}>
          <div style={{ color: "#7a1533", fontSize: "12px", letterSpacing: "2px", marginBottom: "8px", fontFamily: "monospace", fontWeight: "700" }}>⚡ GENERAR DIPLOMADOS</div>
          <p style={{ color: "#5a3a42", fontSize: "13px", marginBottom: "16px", lineHeight: 1.6 }}>
            {ready
              ? <><strong>{students.length} diplomados</strong> listos para generar en un archivo <strong>.ZIP</strong>.</>
              : "Sube el PDF y el Excel para habilitar la generación."}
          </p>
          {generating && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#7a1533", fontSize: "13px", fontWeight: "700", fontFamily: "monospace" }}>Generando diplomados...</span>
                <span style={{ color: "#7a1533", fontSize: "13px", fontWeight: "700", fontFamily: "monospace" }}>{progress}%</span>
              </div>
              <div style={{ background: "#f0e0e4", borderRadius: "999px", height: "12px", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(90deg, #7a1533, #c4748a)", height: "100%", width: `${progress}%`, borderRadius: "999px", transition: "width 0.3s" }} />
              </div>
              <div style={{ color: "#9a6070", fontSize: "12px", marginTop: "6px", fontFamily: "monospace" }}>
                {Math.round(progress * students.length / 100)} de {students.length} diplomados generados
              </div>
            </div>
          )}
          {done && !generating && (
            <div style={{ background: "#edfaf3", border: "2px solid #28a745", borderRadius: "12px", padding: "16px", color: "#1a6b35", fontSize: "14px", fontWeight: "600", marginBottom: "16px", textAlign: "center" }}>
              ✅ ¡{students.length} diplomados generados! El ZIP se descargó automáticamente.
            </div>
          )}
          <button
            onClick={handleGenerateAll}
            disabled={!ready || generating}
            style={{
              width: "100%",
              background: !ready ? "#d4a0aa" : generating ? "#c4748a" : "#7a1533",
              color: "#fff", border: "none", borderRadius: "12px", padding: "18px",
              fontFamily: "monospace", fontSize: "15px", fontWeight: "700",
              cursor: !ready || generating ? "not-allowed" : "pointer",
              letterSpacing: "2px", boxShadow: ready ? "0 4px 16px rgba(122,21,51,0.3)" : "none"
            }}>
            {generating
              ? `⏳ GENERANDO ${progress}%...`
              : done
                ? `📦 GENERAR DE NUEVO (${students.length} diplomados)`
                : `📦 GENERAR ZIP CON ${students.length || "?"} DIPLOMADOS`}
          </button>
        </div>
      </div>
    </div>
  );
}