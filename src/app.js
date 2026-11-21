const express = require('express');
const path = require('path');
const fs = require('fs');

// build-info.json lo genera CodeBuild en la etapa de construcción.
// Si no existe (por ejemplo, al correr en local), se usan valores por defecto.
function leerInfoBuild() {
  const ruta = path.join(__dirname, '..', 'build-info.json');
  try {
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch {
    return { commit: 'local', buildId: 'local', fecha: null };
  }
}

const VERSION = '1.0.0';
const MENSAJE = 'Hola desde AWS CodePipeline';

function crearApp() {
  const app = express();
  const build = leerInfoBuild();

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (req, res) => {
    res.json({ estado: 'ok' });
  });

  app.get('/api/info', (req, res) => {
    res.json({
      app: 'actividad5-pipeline',
      mensaje: MENSAJE,
      version: VERSION,
      commit: build.commit,
      buildId: build.buildId,
      fechaBuild: build.fecha,
      entorno: process.env.ENTORNO || 'local'
    });
  });

  app.get('/api/saludo/:nombre', (req, res) => {
    const nombre = req.params.nombre.trim();
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    res.json({ saludo: `Hola, ${nombre}` });
  });

  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  return app;
}

module.exports = { crearApp, VERSION, MENSAJE };
