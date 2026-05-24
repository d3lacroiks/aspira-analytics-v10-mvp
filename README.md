# ASPIRA Analytics — MVP (Protocolo ASPIRA v10) UI2+

## Ejecutar (Windows / macOS / Linux)
1) Abre una terminal en esta carpeta (donde está package.json)
2) Instala dependencias:
   npm install
3) Copia .env (opcional para IA):
   - Windows (PowerShell):  copy .env.example .env
   - Windows (CMD):        copy .env.example .env
   - macOS/Linux:          cp .env.example .env
4) Corre:
   npm run dev
5) Abre:
   http://localhost:8787

## Guardado
- Se guarda localmente en tu navegador (localStorage).
- Puedes crear varias obras y volver a editarlas luego.

## IA (opcional)
- Si configuras HF_TOKEN en .env, podrás usar "Asistencia IA" en los pasos 2/4/5.
- La IA NO reemplaza tu análisis; solo sugiere descripciones/preguntas.
