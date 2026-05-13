🎓 DiplomaGen — Generador de Diplomados UAdeO

Sistema web para generar diplomados y certificados en PDF de forma automática, a partir de una plantilla y un listado de estudiantes en Excel.

---
✨ Características

- 📄 Sube cualquier plantilla de diplomado en formato PDF
- 📊 Carga el listado de estudiantes desde Excel (.xlsx / .xls)
- 👁 Previsualización en tiempo real del nombre sobre el diploma
- 🔤 15 tipografías disponibles (clásicas, modernas y cursivas)
- 🎨 Paleta de 45 colores + selector de color personalizado (HEX)
- 📏 Control de posición X, Y y tamaño de fuente con sliders
- 📦 Genera todos los diplomados de una sola vez en un archivo ZIP
- ✅ Soporte para acentos y caracteres especiales en español

---
🛠 Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| React 18 + TypeScript | Framework principal |
| Vite | Bundler y servidor de desarrollo |
| pdf-lib | Generación y edición de PDFs |
| pdfjs-dist | Previsualización del PDF en canvas |
| xlsx | Lectura de archivos Excel |
| jszip | Empaquetado de PDFs en ZIP |
| @pdf-lib/fontkit | Embedding de fuentes TTF personalizadas |
| Google Fonts | Fuentes para la previsualización |

---
📋 Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- npm v9 o superior

Verifica tu instalación:
```bash
node --version
npm --version
```

---
🚀 Instalación

1. Clona el repositorio

```bash
git clone https://github.com/tu-usuario/diploma_lab.git
cd diploma_lab
```
2. Instala las dependencias

```bash
npm install
```
3. Descarga las fuentes TTF

Las fuentes deben estar en la carpeta `public/fonts/`. Ejecuta estos comandos en PowerShell:

```powershell
mkdir public\fonts

Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/refs/heads/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf" -OutFile "public\fonts\DancingScript-Bold.ttf"

Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/refs/heads/main/ofl/greatvibes/GreatVibes-Regular.ttf" -OutFile "public\fonts\GreatVibes-Regular.ttf"

Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/refs/heads/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf" -OutFile "public\fonts\PlayfairDisplay-BoldItalic.ttf"

Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/refs/heads/main/ofl/cinzel/Cinzel%5Bwght%5D.ttf" -OutFile "public\fonts\Cinzel-Bold.ttf"

Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/refs/heads/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf" -OutFile "public\fonts\Montserrat-Bold.ttf"

Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/refs/heads/main/ofl/raleway/Raleway%5Bwght%5D.ttf" -OutFile "public\fonts\Raleway-BoldItalic.ttf"

Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/refs/heads/main/ofl/pacifico/Pacifico-Regular.ttf" -OutFile "public\fonts\Pacifico-Regular.ttf"

Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/refs/heads/main/ofl/sacramento/Sacramento-Regular.ttf" -OutFile "public\fonts\Sacramento-Regular.ttf"

Invoke-WebRequest -Uri "https://github.com/google/fonts/raw/refs/heads/main/ofl/parisienne/Parisienne-Regular.ttf" -OutFile "public\fonts\Satisfy-Regular.ttf"
```

4. Inicia el servidor de desarrollo

```bash
npm run dev
```

Abre tu navegador en: **http://localhost:5173**

---

📖 Cómo usar la aplicación

Paso 1 — Sube la plantilla PDF
Haz clic en el área de carga y selecciona el archivo PDF del diplomado. La previsualización aparecerá automáticamente a la derecha.

Paso 2 — Sube el listado de estudiantes
Carga el archivo Excel con los datos. El sistema detecta automáticamente las columnas de nombre, taller, horas y fecha.

> **Formato recomendado del Excel:**
> | NOMBRE | TALLER | HORAS | FECHA |
> |---|---|---|---|
> | Ana Sofía Ramírez Torres | Inteligencia Artificial | 30 | Noviembre 2025 |

Paso 3 — Mapea las columnas
Verifica que cada campo (Nombre, Taller, Horas, Fecha) esté asignado a la columna correcta del Excel.

Paso 4 — Ajusta fuente, color y posición
- Selecciona la **tipografía** de la lista
- Elige el **color** del texto desde la paleta o ingresa un código HEX
- Mueve los **sliders** de X, Y y tamaño de fuente mientras ves los cambios en tiempo real

Paso 5 — Genera el ZIP
Haz clic en **"GENERAR ZIP"** y espera a que se procesen todos los diplomados. El archivo se descargará automáticamente con el nombre de cada estudiante.

---

📁 Estructura del proyecto

```
diploma_lab/
├── public/
│   └── fonts/              ← Fuentes TTF para los PDFs
│       ├── DancingScript-Bold.ttf
│       ├── GreatVibes-Regular.ttf
│       ├── PlayfairDisplay-BoldItalic.ttf
│       ├── Cinzel-Bold.ttf
│       ├── Montserrat-Bold.ttf
│       ├── Raleway-BoldItalic.ttf
│       ├── Pacifico-Regular.ttf
│       ├── Sacramento-Regular.ttf
│       └── Satisfy-Regular.ttf
├── src/
│   ├── App.tsx             ← Componente principal
│   ├── main.tsx            ← Punto de entrada
│   └── index.css           ← Estilos globales
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

📦 Dependencias principales

```json
{
  "dependencies": {
    "pdf-lib": "^1.17.1",
    "pdfjs-dist": "^3.11.174",
    "xlsx": "^0.18.5",
    "jszip": "^3.10.1",
    "@pdf-lib/fontkit": "^1.1.1"
  }
}
```

---

⚠️ Notas importantes

- Las fuentes deben estar en `public/fonts/` en formato **TTF válido**. Si una fuente falla al cargar, el sistema usa automáticamente la fuente clásica como alternativa.
- El sistema funciona completamente en el navegador — no requiere servidor backend ni base de datos.
- Para producción, ejecuta `npm run build` y despliega la carpeta `dist/` en cualquier hosting estático (Netlify, Vercel, GitHub Pages, etc.).

---

🏗 Construcción para producción

```bash
npm run build
```

Los archivos optimizados quedarán en la carpeta `dist/`.

---
👩‍💻 Desarrollado para

**Universidad Autónoma de Occidente — Unidad Regional Los Mochis**  
Jornada Académica TechXplora · Programas Educativos de LSC e ISOF

---
📄 Licencia

MIT License — libre para uso académico e institucional.
