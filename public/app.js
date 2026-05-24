/* ASPIRA Analytics — MVP UI2+
   - Guardado: localStorage (biblioteca multi-obra)
   - Archivo Onírico: global (persistente entre obras) + vínculos por paso
*/

const APP_VERSION = "v10-ui2-plus-0.2.0";

const LS_LIBRARY = "aspira_v10_library";
const LS_CURRENT = "aspira_v10_current_id";
const LS_MOTIFS = "aspira_v10_motifs_global";

const STEPS = [
  { n: 1, title: "Paso 1 — Preámbulo (Ficha técnica)", sub: "Identificación estable de la obra." },
  { n: 2, title: "Paso 2 — Pre-iconográfico (¿qué se ve?)", sub: "Descripción objetiva y preguntas." },
  { n: 3, title: "Paso 3 — Formal (¿cómo está hecho?)", sub: "Composición, técnica, ritmo, organización." },
  { n: 4, title: "Paso 4 — Iconográfico (motivos/temas)", sub: "Motivos posibles, evidencias, verificación." },
  { n: 5, title: "Paso 5 — Semiótico (¿cómo significa?)", sub: "Códigos, oposiciones, agencia, registros." },
  { n: 6, title: "Paso 6 — Psicología del arte", sub: "Afectos, tensión, energía, experiencia." },
  { n: 7, title: "Paso 7 — Síntesis antropológica / iconológica", sub: "Articulación cultural y sentido situado." },
  { n: 8, title: "Paso 8 — Serie y temporalidad", sub: "Serie, variación, coherencia interna." },
  { n: 9, title: "Paso 9 — Singularidad y comparación (campo)", sub: "Comparación controlada y posición en el campo." },
  { n: 10, title: "Paso 10 — Cierre (micro-tesis verificable)", sub: "Hallazgos, límites, aportes, trazabilidad." },
];

const $ = (id) => document.getElementById(id);

function nowISO() {
  return new Date().toISOString();
}
function uid() {
  return "w_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function defaultWork() {
  const id = uid();
  const steps = {};
  for (const s of STEPS) {
    steps[s.n] = { text: "", evidence: "", cites: "", sources: "", updatedAt: "" };
  }
  return {
    id,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    imageDataUrl: "",
    meta: {
      artist: "",
      title: "",
      year: "",
      series: "",
      technique: "",
      measures: "",
      source: "",
      notes: ""
    },
    metaExtended: "",
    stepSources: "",
    steps,
    linkedByStep: {} // step -> [motifId,...]
  };
}

function defaultMotifs() {
  return [
    { id: "m_machete", name: "Machete", author: "Graciela Arias", type: "objeto / agencia", aura: "", createdAt: nowISO() },
    { id: "m_fuego", name: "Fuego / incendio", author: "Graciela Arias", type: "evento / memoria", aura: "", createdAt: nowISO() },
    { id: "m_semilla", name: "Semilla / germinación", author: "Graciela Arias", type: "vegetal / medicina", aura: "", createdAt: nowISO() },
    { id: "m_ojo", name: "Ojo / mirada", author: "Graciela Arias", type: "atmósfera / luz", aura: "", createdAt: nowISO() },
    { id: "m_trama", name: "Trama / textil", author: "Graciela Arias", type: "patrón / kené", aura: "", createdAt: nowISO() },
    { id: "m_luz", name: "Luz / resplandor", author: "Graciela Arias", type: "atmósfera / luz", aura: "", createdAt: nowISO() },
  ];
}

let library = loadJSON(LS_LIBRARY, {});        // id -> work
let currentId = localStorage.getItem(LS_CURRENT) || "";
let motifs = loadJSON(LS_MOTIFS, null) || defaultMotifs();
let currentStep = 1;

function ensureCurrent() {
  if (currentId && library[currentId]) return;
  const w = defaultWork();
  library[w.id] = w;
  currentId = w.id;
  localStorage.setItem(LS_CURRENT, currentId);
  saveJSON(LS_LIBRARY, library);
  saveJSON(LS_MOTIFS, motifs);
}
ensureCurrent();

function getWork() {
  return library[currentId];
}
function persist() {
  const w = getWork();
  w.updatedAt = nowISO();
  saveJSON(LS_LIBRARY, library);
  saveJSON(LS_MOTIFS, motifs);
}

function setPill() {
  const w = getWork();
  const t = w.meta?.title?.trim() || "—";
  const pill = $("workPill");
  if (pill) pill.textContent = `Obra: ${t}`;
}

function baseSheetText() {
  const w = getWork();
  const m = w.meta || {};
  const lines = [
    `Artista — ${m.artist || "—"}`,
    `Título — ${m.title || "—"}`,
    `Año — ${m.year || "—"}`,
    `Serie/Proyecto — ${m.series || "—"}`,
    `Técnica/soporte — ${m.technique || "—"}`,
    `Medidas — ${m.measures || "—"}`,
    `Fuente — ${m.source || "—"}`,
    `Notas — ${m.notes || "—"}`
  ];
  return lines.join("\n");
}

function renderBaseSheet() {
  const el = $("baseSheet");
  if (el) el.textContent = baseSheetText();
}

function renderImage() {
  const w = getWork();
  const img = $("imgPreview");
  const empty = $("imgEmpty");
  if (!img || !empty) return;

  if (w.imageDataUrl) {
    img.src = w.imageDataUrl;
    img.style.display = "block";
    empty.style.display = "none";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
    empty.style.display = "flex";
  }
}

function setMetaInputs() {
  const w = getWork();
  const m = w.meta || {};
  if ($("metaArtist")) $("metaArtist").value = m.artist || "";
  if ($("metaTitle")) $("metaTitle").value = m.title || "";
  if ($("metaYear")) $("metaYear").value = m.year || "";
  if ($("metaSeries")) $("metaSeries").value = m.series || "";
  if ($("metaTechnique")) $("metaTechnique").value = m.technique || "";
  if ($("metaMeasures")) $("metaMeasures").value = m.measures || "";
  if ($("metaSource")) $("metaSource").value = m.source || "";
  if ($("metaNotes")) $("metaNotes").value = m.notes || "";
}

function readMetaInputs() {
  const w = getWork();
  w.meta = {
    artist: ($("metaArtist")?.value || "").trim(),
    title: ($("metaTitle")?.value || "").trim(),
    year: ($("metaYear")?.value || "").trim(),
    series: ($("metaSeries")?.value || "").trim(),
    technique: ($("metaTechnique")?.value || "").trim(),
    measures: ($("metaMeasures")?.value || "").trim(),
    source: ($("metaSource")?.value || "").trim(),
    notes: ($("metaNotes")?.value || "").trim()
  };
}

function statusForStep(n) {
  const w = getWork();
  const st = w.steps?.[n];
  const has = !!(st && (st.text || st.evidence || st.cites || st.sources));
  return has ? "ok" : "pend";
}

function renderStepsList() {
  const root = $("stepsList");
  if (!root) return;

  root.innerHTML = "";
  for (const s of STEPS) {
    const div = document.createElement("div");
    div.className = "stepItem" + (s.n === currentStep ? " active" : "");
    div.dataset.step = String(s.n);

    const left = document.createElement("div");
    left.innerHTML = `
      <div class="stepName">${escapeHtml(s.n + ". " + s.title.replace(/^Paso \\d+ — /, ""))}</div>
      <div class="stepSub">Parte II</div>
    `;

    const badge = document.createElement("div");
    const st = statusForStep(s.n);
    badge.className = "badge " + (st === "ok" ? "ok" : "");
    badge.textContent = st === "ok" ? "OK" : "Pend.";

    div.appendChild(left);
    div.appendChild(badge);

    div.addEventListener("click", () => {
      currentStep = s.n;
      renderAll();
    });

    root.appendChild(div);
  }
}

function renderStepMain() {
  const step = STEPS.find(x => x.n === currentStep);
  if ($("stepTitle")) $("stepTitle").textContent = step?.title || "Paso";
  if ($("stepSub")) $("stepSub").textContent = step?.sub || "";

  const w = getWork();
  const st = w.steps[currentStep] || { text:"", evidence:"", cites:"", sources:"" };

  if ($("metaExtended")) $("metaExtended").value = w.metaExtended || "";
  if ($("stepSources")) $("stepSources").value = w.stepSources || "";

  if ($("stepText")) $("stepText").value = st.text || "";
  if ($("stepEvidence")) $("stepEvidence").value = st.evidence || "";
  if ($("stepCites")) $("stepCites").value = st.cites || "";

  const done = STEPS.map(s => statusForStep(s.n)).filter(x => x === "ok").length;
  if ($("progressText")) $("progressText").textContent = `${done}/10`;
}

function saveStep() {
  const w = getWork();
  w.metaExtended = $("metaExtended")?.value || "";
  w.stepSources = $("stepSources")?.value || "";

  const st = w.steps[currentStep] || {};
  st.text = $("stepText")?.value || "";
  st.evidence = $("stepEvidence")?.value || "";
  st.cites = $("stepCites")?.value || "";
  st.sources = w.stepSources;
  st.updatedAt = nowISO();
  w.steps[currentStep] = st;

  persist();
  renderStepsList();
  toast(`Paso ${currentStep} guardado.`);
}

function saveWork() {
  readMetaInputs();
  persist();
  renderBaseSheet();
  setPill();
  renderStepsList();
  toast("Obra guardada.");
}

function toast(msg) {
  showDialog("Listo", msg, { okOnly: true });
}

function showDialog(title, body, opts = {}) {
  const dlg = $("dlg");
  if (!dlg) {
    alert(`${title}\n\n${body}`);
    if (opts.onOk) opts.onOk();
    return;
  }

  const titleEl = $("dlgTitle");
  const bodyEl = $("dlgBody");
  const okBtn = $("dlgOk");
  const cancelBtn = $("dlgCancel");

  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.textContent = body;

  if (cancelBtn) {
    if (opts.okOnly) cancelBtn.classList.add("hidden");
    else cancelBtn.classList.remove("hidden");
  }

  const onOk = () => {
    okBtn?.removeEventListener("click", onOk);
    cancelBtn?.removeEventListener("click", onCancel);
    dlg.close();
    if (opts.onOk) opts.onOk();
  };
  const onCancel = () => {
    okBtn?.removeEventListener("click", onOk);
    cancelBtn?.removeEventListener("click", onCancel);
    dlg.close();
    if (opts.onCancel) opts.onCancel();
  };

  okBtn?.addEventListener("click", onOk);
  cancelBtn?.addEventListener("click", onCancel);

  dlg.showModal();
}

/* ✅ CORREGIDO: string multi-línea con backticks */
function newWorkFlow() {
  showDialog(
    "Nueva obra",
    `¿Crear una nueva obra?

El Archivo Onírico es global (se conserva). La obra actual quedará guardada en tu biblioteca local.`,
    {
      onOk: () => {
        const w = defaultWork();
        library[w.id] = w;
        currentId = w.id;
        localStorage.setItem(LS_CURRENT, currentId);
        persist();
        currentStep = 1;
        renderAll();
      }
    }
  );
}

function renderMotifList() {
  const q = ($("motifSearch")?.value || "").trim().toLowerCase();
  const list = $("motifList");
  if (!list) return;

  list.innerHTML = "";

  const filtered = motifs.filter(m => {
    if (!q) return true;
    return (m.name || "").toLowerCase().includes(q) ||
           (m.type || "").toLowerCase().includes(q) ||
           (m.author || "").toLowerCase().includes(q) ||
           (m.aura || "").toLowerCase().includes(q);
  });

  for (const m of filtered) {
    const row = document.createElement("div");
    row.className = "motifRow";

    const meta = document.createElement("div");
    meta.className = "motifMeta";
    meta.innerHTML = `
      <div class="motifName">${escapeHtml(m.name)}</div>
      <div class="motifSub">${escapeHtml(m.type)} · autor/a: ${escapeHtml(m.author || "—")}${m.aura ? ` · aura: ${escapeHtml(m.aura)}` : ""}</div>
    `;

    const btns = document.createElement("div");
    btns.className = "motifBtns";

    const linkBtn = document.createElement("button");
    linkBtn.className = "btn ghost";
    linkBtn.textContent = "Vincular";
    linkBtn.addEventListener("click", () => linkMotifToStep(m.id));

    const delBtn = document.createElement("button");
    delBtn.className = "iconBtn danger";
    delBtn.title = "Eliminar motivo";
    delBtn.textContent = "×";
    delBtn.addEventListener("click", () => deleteMotif(m.id));

    btns.appendChild(linkBtn);
    btns.appendChild(delBtn);

    row.appendChild(meta);
    row.appendChild(btns);
    list.appendChild(row);
  }
}

function addMotif() {
  const name = ($("newMotifName")?.value || "").trim();
  const author = ($("newMotifAuthor")?.value || "").trim();
  const type = ($("newMotifType")?.value || "").trim();
  const aura = ($("newMotifAura")?.value || "").trim();

  if (!name) return toast("Escribe un nombre de motivo.");
  const id = "m_" + uid();

  motifs.unshift({ id, name, author, type, aura, createdAt: nowISO() });

  if ($("newMotifName")) $("newMotifName").value = "";
  if ($("newMotifAuthor")) $("newMotifAuthor").value = "";
  if ($("newMotifAura")) $("newMotifAura").value = "";

  persist();
  renderMotifList();
}

/* ✅ CORREGIDO: string multi-línea con backticks */
function deleteMotif(id) {
  showDialog(
    "Eliminar motivo",
    `¿Eliminar este motivo del Archivo Onírico?
Se quitará también de los vínculos.`,
    {
      onOk: () => {
        motifs = motifs.filter(m => m.id !== id);

        // remover vínculos en todas las obras
        for (const wid of Object.keys(library)) {
          const w = library[wid];
          for (const k of Object.keys(w.linkedByStep || {})) {
            w.linkedByStep[k] = (w.linkedByStep[k] || []).filter(mid => mid !== id);
          }
        }

        persist();
        renderMotifList();
        renderLinkedMotifs();
      }
    }
  );
}

function linkMotifToStep(motifId) {
  const w = getWork();
  if (!w.linkedByStep[currentStep]) w.linkedByStep[currentStep] = [];
  if (!w.linkedByStep[currentStep].includes(motifId)) {
    w.linkedByStep[currentStep].push(motifId);
    persist();
  }
  renderLinkedMotifs();
}

function unlinkMotifFromStep(motifId) {
  const w = getWork();
  const arr = w.linkedByStep[currentStep] || [];
  w.linkedByStep[currentStep] = arr.filter(x => x !== motifId);
  persist();
  renderLinkedMotifs();
}

function renderLinkedMotifs() {
  const w = getWork();
  const ids = w.linkedByStep[currentStep] || [];
  const out = $("linkedMotifs");
  if (!out) return;

  if (!ids.length) {
    out.textContent = "Ninguno aún. (Usa “Vincular” en un motivo.)";
    return;
  }
  const items = ids.map(id => motifs.find(m => m.id === id)).filter(Boolean);
  const lines = items.map(m => `• ${m.name} — ${m.type} · autor/a: ${m.author || "—"}${m.aura ? ` · aura: ${m.aura}` : ""}`);
  out.textContent = lines.join("\n");
}

async function assistIA() {
  const step = currentStep;
  if (![2,4,5].includes(step)) {
    return showDialog("Asistencia IA", "Disponible solo para pasos 2, 4 y 5.", { okOnly: true });
  }

  const w = getWork();
  const imageDataUrl = w.imageDataUrl || "";

  showDialog("Asistencia IA", "Consultando… (si no configuraste HF_TOKEN puede fallar).", { okOnly: true });

  try {
    const res = await fetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step, imageDataUrl })
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Error desconocido.");

    const suggestion = [
      data.caption ? `CAPTION: ${data.caption}\n` : "",
      data.content || ""
    ].join("\n");

    showDialog(
      "Asistencia IA (sugerencia)",
      suggestion,
      {
        onOk: () => {
          const cur = $("stepText")?.value || "";
          const add = "\n\n---\nSugerencia IA (verificar):\n" + suggestion;
          if ($("stepText")) $("stepText").value = cur ? (cur + add) : ("Sugerencia IA (verificar):\n" + suggestion);
        },
        onCancel: () => {}
      }
    );

    // Ajustar etiquetas del diálogo (si existe)
    const ok = $("dlgOk");
    const cancel = $("dlgCancel");
    if (ok) ok.textContent = "Insertar en el paso";
    if (cancel) cancel.textContent = "Cerrar";

    const dlg = $("dlg");
    if (dlg) {
      dlg.addEventListener("close", () => {
        if (ok) ok.textContent = "OK";
        if (cancel) cancel.textContent = "Cerrar";
      }, { once: true });
    }

  } catch (e) {
    showDialog("Asistencia IA", `No se pudo obtener respuesta.\n\n${String(e.message || e)}`, { okOnly: true });
  }
}

function exportReport() {
  const w = getWork();
  const m = w.meta || {};
  const date = new Date().toLocaleString();

  const stepsHtml = STEPS.map(s => {
    const st = w.steps[s.n] || {};
    const linked = (w.linkedByStep[s.n] || []).map(id => motifs.find(x => x.id === id)).filter(Boolean);
    const linkedHtml = linked.length
      ? `<ul>${linked.map(mm => `<li><b>${escapeHtml(mm.name)}</b> — ${escapeHtml(mm.type)} · autor/a: ${escapeHtml(mm.author||"—")}${mm.aura?` · aura: ${escapeHtml(mm.aura)}`:""}</li>`).join("")}</ul>`
      : "<div class='muted'>Sin vínculos.</div>";

    return `
      <section class="sec">
        <h2>${escapeHtml(s.title)}</h2>
        <div class="muted">${escapeHtml(s.sub)}</div>
        <h3>Texto</h3>
        <pre>${escapeHtml(st.text || "")}</pre>
        <h3>Evidencias</h3>
        <pre>${escapeHtml(st.evidence || "")}</pre>
        <h3>Citas</h3>
        <pre>${escapeHtml(st.cites || "")}</pre>
        <h3>Motivos vinculados</h3>
        ${linkedHtml}
      </section>
    `;
  }).join("\n");

  const html = `<!doctype html>
  <html lang="es"><head><meta charset="utf-8"/>
  <title>Informe ASPIRA — ${escapeHtml(m.title||"Obra")}</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; padding:24px; color:#111;}
    .muted{color:#555;}
    pre{white-space:pre-wrap; background:#f6f6f6; padding:12px; border-radius:10px;}
    .sec{margin:18px 0; padding-top:10px; border-top:1px solid #ddd;}
    .grid{display:grid; grid-template-columns: 1fr 1fr; gap:10px;}
    .box{border:1px solid #ddd; border-radius:12px; padding:12px;}
    img{max-width:100%; height:auto; border-radius:12px; border:1px solid #ddd;}
    h1{margin:0 0 6px;}
  </style></head><body>
    <h1>ASPIRA Analytics — Informe</h1>
    <div class="muted">Generado: ${escapeHtml(date)} · App: ${escapeHtml(APP_VERSION)}</div>

    <div class="sec">
      <h2>Ficha técnica (PARTE I)</h2>
      <div class="grid">
        <div class="box">
          <div><b>Artista:</b> ${escapeHtml(m.artist||"")}</div>
          <div><b>Título:</b> ${escapeHtml(m.title||"")}</div>
          <div><b>Año:</b> ${escapeHtml(m.year||"")}</div>
          <div><b>Serie/Proyecto:</b> ${escapeHtml(m.series||"")}</div>
          <div><b>Técnica:</b> ${escapeHtml(m.technique||"")}</div>
          <div><b>Medidas:</b> ${escapeHtml(m.measures||"")}</div>
          <div><b>Procedencia/Fuente:</b> ${escapeHtml(m.source||"")}</div>
          <div><b>Notas:</b> ${escapeHtml(m.notes||"")}</div>
          <div><b>Metadatos extendidos:</b> ${escapeHtml(w.metaExtended||"")}</div>
          <div><b>Fuentes/verificación:</b> ${escapeHtml(w.stepSources||"")}</div>
        </div>
        <div class="box">
          ${w.imageDataUrl ? `<img src="${w.imageDataUrl}" alt="obra"/>` : `<div class="muted">Sin imagen.</div>`}
        </div>
      </div>
    </div>

    <div class="sec">
      <h2>Archivo Onírico (global)</h2>
      ${motifs.length ? `<ul>${motifs.map(mm => `<li><b>${escapeHtml(mm.name)}</b> — ${escapeHtml(mm.type)} · autor/a: ${escapeHtml(mm.author||"—")}${mm.aura?` · aura: ${escapeHtml(mm.aura)}`:""}</li>`).join("")}</ul>` : "<div class='muted'>Vacío.</div>"}
    </div>

    ${stepsHtml}

    <div class="sec">
      <h2>Notas de método</h2>
      <div class="muted">Este informe compila lo registrado por el/la analista. La IA, si se usó, aparece como “Sugerencia IA (verificar)” dentro del texto del paso.</div>
    </div>

    <div class="sec">
      <h2>Exportación</h2>
      <div class="muted">Para PDF: usa Imprimir → Guardar como PDF.</div>
    </div>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const safe = (m.title || "obra").replace(/[^a-z0-9-_]+/gi, "_").slice(0,60);
  a.download = `informe_aspira_${safe || "obra"}.html`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function formatLocalDate(iso) {
  try { return new Date(iso).toLocaleString(); }
  catch { return iso || ""; }
}

function openLibrary() {
  const dlg = $("dlgLibrary");
  if (!dlg) return toast("No se encontró el diálogo de biblioteca (dlgLibrary).");
  renderLibraryList();
  dlg.showModal();
}

function closeLibrary() {
  $("dlgLibrary")?.close();
}

function renderLibraryList() {
  const root = $("libraryList");
  if (!root) return;

  const ids = Object.keys(library).sort((a,b) => {
    const A = library[a]?.updatedAt || "";
    const B = library[b]?.updatedAt || "";
    return B.localeCompare(A);
  });

  if (!ids.length) {
    root.textContent = "No hay obras guardadas aún.";
    return;
  }

  root.innerHTML = "";
  for (const id of ids) {
    const w = library[id];
    const m = w?.meta || {};

    const row = document.createElement("div");
    row.className = "libraryRow";

    const meta = document.createElement("div");
    meta.className = "libraryMeta";
    meta.innerHTML = `
      <div class="libraryTitle">${escapeHtml(m.title || "Sin título")} <span class="muted" style="font-weight:600">(${escapeHtml(m.year||"—")})</span></div>
      <div class="librarySub">${escapeHtml(m.artist || "—")} · actualizado: ${escapeHtml(formatLocalDate(w.updatedAt))}</div>
    `;

    const btns = document.createElement("div");
    btns.className = "motifBtns";

    const openBtn = document.createElement("button");
    openBtn.className = "btn primary";
    openBtn.textContent = (id === currentId) ? "Abierta" : "Abrir";
    openBtn.disabled = (id === currentId);
    openBtn.addEventListener("click", () => {
      currentId = id;
      localStorage.setItem(LS_CURRENT, currentId);
      persist();
      currentStep = 1;
      renderAll();
      closeLibrary();
    });

    const delBtn = document.createElement("button");
    delBtn.className = "iconBtn danger";
    delBtn.title = "Eliminar obra";
    delBtn.textContent = "×";
    delBtn.addEventListener("click", () => {
      showDialog("Eliminar obra", "¿Eliminar esta obra? (No afecta el Archivo Onírico global).", {
        onOk: () => {
          delete library[id];

          if (currentId === id) {
            const next = Object.keys(library)[0];
            if (next) {
              currentId = next;
              localStorage.setItem(LS_CURRENT, currentId);
            } else {
              const nw = defaultWork();
              library[nw.id] = nw;
              currentId = nw.id;
              localStorage.setItem(LS_CURRENT, currentId);
            }
          }

          persist();
          renderAll();
          renderLibraryList();
        }
      });
    });

    btns.appendChild(openBtn);
    btns.appendChild(delBtn);

    row.appendChild(meta);
    row.appendChild(btns);
    root.appendChild(row);
  }
}

function bindUI() {
  // Save shortcut
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      saveWork();
    }
  });

  $("btnSaveWork")?.addEventListener("click", saveWork);
  $("btnSaveStep")?.addEventListener("click", saveStep);
  $("btnPrev")?.addEventListener("click", () => { if (currentStep > 1) { currentStep--; renderAll(); } });
  $("btnNext")?.addEventListener("click", () => { if (currentStep < 10) { currentStep++; renderAll(); } });
  $("btnViewBase")?.addEventListener("click", () => showDialog("Ficha base", baseSheetText(), { okOnly: true }));
  $("btnNewWork")?.addEventListener("click", newWorkFlow);
  $("btnLibrary")?.addEventListener("click", openLibrary);
  $("btnCloseLibrary")?.addEventListener("click", closeLibrary);
  $("btnReport")?.addEventListener("click", exportReport);

  $("btnHelp")?.addEventListener("click", () => {
    const txt = [
      "Cómo funciona:",
      "• PARTE I: registra imagen + ficha técnica (se guarda).",
      "• PARTE II: aplica pasos 1–10 y guarda cada paso.",
      "• Archivo Onírico: motivos globales con autor/a; vincúlalo por paso (2/4/8 recomendado).",
      "",
      "IA (opcional):",
      "• Si configuras HF_TOKEN, puedes pedir asistencia en pasos 2/4/5.",
      "• La IA no reemplaza tu análisis: solo sugiere (siempre verificable).",
      "",
      `Versión: ${APP_VERSION}`
    ].join("\n");
    showDialog("Ayuda", txt, { okOnly: true });
  });

  $("btnToggleMotifForm")?.addEventListener("click", () => {
    $("motifForm")?.classList.toggle("hidden");
  });

  $("btnAddMotif")?.addEventListener("click", addMotif);
  $("motifSearch")?.addEventListener("input", renderMotifList);

  $("btnAssist")?.addEventListener("click", assistIA);

  // Image upload
  $("inpImage")?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const w = getWork();
      w.imageDataUrl = String(reader.result || "");
      persist();
      renderImage();
    };
    reader.readAsDataURL(file);
  });
}

function renderAll() {
  setPill();
  renderImage();
  setMetaInputs();
  renderBaseSheet();
  renderStepsList();
  renderStepMain();
  renderMotifList();
  renderLinkedMotifs();
}

document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  renderAll();
});

/* ✅ PWA: Registrar Service Worker */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}
