# Actividad 5 · Taller Pipeline de CI/CD con AWS

App Node.js (Express) que se despliega sola en **AWS Elastic Beanstalk** cada vez que hago `git push`, usando **AWS CodePipeline** (orquestación) y **AWS CodeBuild** (pruebas y empaquetado).

```
GitHub (main) ──push──▶ CodePipeline ──▶ [Fuente] ──▶ [Construcción: CodeBuild] ──▶ [Despliegue: Elastic Beanstalk]
                                                       npm ci · npm test ·          Node.js 22 · 1 instancia
                                                       build-info.json              t3.micro
```

| Archivo | Para qué sirve |
|---|---|
| `src/app.js` | Rutas: `/` (página), `/api/info` (versión + commit desplegado), `/api/saludo/:nombre`, `/health` |
| `test/app.test.js` | 5 pruebas unitarias (node:test + supertest) |
| `buildspec.yml` | Pasos de CodeBuild: instalar, probar, informe JUnit, artefacto |
| `plan-b/` | Workflow de GitHub Actions por si el Learner Lab bloquea CodePipeline |

---

## Paso 0 · Revisar permisos del Learner Lab (2 min)

1. En AWS Academy: **Start Lab** → cuando el círculo esté verde, clic en **AWS**. Región: **us-east-1 (N. Virginia)**.
2. Abre **CloudShell** (ícono `>_` arriba a la derecha) → *Actions → Upload file* → sube `00_probar-permisos-learner-lab.sh`.
3. Ejecuta: `bash 00_probar-permisos-learner-lab.sh` → **captura**.

- CodeBuild y CodePipeline en **OK** → sigue esta guía.
- CodeBuild **BLOQUEADO** pero CodePipeline OK → haz la guía y en el paso 4 **omite la etapa de construcción** (en este taller es opcional).
- CodePipeline **BLOQUEADO** → usa el **Plan B** (al final). Guarda la captura del error: va en el informe.

## Paso 1 · Probar en local y subir a GitHub

```powershell
cd E:\Trabajos_LaSalle\7mo\herramientasDeSoftware_2\actividad5
npm install
npm test            # 5 pruebas en verde
npm start           # abre http://localhost:8080
```

Crea un repo **público** en GitHub llamado `actividad5-pipeline` (sin README) y:

```powershell
git init -b main
git add .
git commit -m "App inicial para pipeline CI/CD"
git remote add origin https://github.com/TU_USUARIO/actividad5-pipeline.git
git push -u origin main
```

## Paso 2 · Crear el entorno de Elastic Beanstalk (consola)

**Elastic Beanstalk → Create application**

| Campo | Valor |
|---|---|
| Application name | `actividad5-pipeline` |
| Environment name | `actividad5-env` |
| Platform | Node.js · rama **Node.js 22 running on 64bit Amazon Linux 2023** |
| Application code | Sample application |
| Presets | **Single instance (free tier eligible)** |
| Service role | *Use an existing service role* → **LabRole** |
| EC2 key pair | `vockey` |
| EC2 instance profile | **LabInstanceProfile** |

*Skip to review → Submit*. Espera ~5 min a que salga **Health: Ok** → **captura** con la URL del entorno.

## Paso 3 · Conectar GitHub con AWS

**CodePipeline → Settings → Connections → Create connection** → GitHub → nombre `github-daniel` → **Install a new app** → autoriza tu repo → **Connect**. Debe quedar en estado **Available** → **captura**.

> Si la conexión da error de permisos, crea el repo en **CodeCommit** y empuja el código desde CloudShell (ver *Alternativa CodeCommit* al final).

## Paso 4 · Crear el pipeline (consola)

**CodePipeline → Create pipeline → Build custom pipeline**

1. **Pipeline settings**: nombre `actividad5-pipeline`, *Execution mode: Superseded*, **Service role: Existing service role → `LabRole`**. → *Next*
2. **Source**: *GitHub (via GitHub App)* → conexión `github-daniel` → repo `TU_USUARIO/actividad5-pipeline` → rama `main` → deja activado el *trigger* por **push**. → *Next*
3. **Build**: *Other build providers → AWS CodeBuild* → **Create project** (abre una ventana):
   - Project name: `actividad5-build`
   - Environment: *Managed image* · *EC2* · Amazon Linux · *Standard* · imagen `aws/codebuild/amazonlinux-x86_64-standard:5.0`
   - Compute: **3 GB memory, 2 vCPUs** (la más pequeña)
   - Service role: **Existing service role → `LabRole`** (desmarca *Allow AWS CodeBuild to modify this service role*)
   - Buildspec: *Use a buildspec file*
   - *Continue to CodePipeline* → *Next*
4. **Test**: *Skip test stage*.
5. **Deploy**: *AWS Elastic Beanstalk* → app `actividad5-pipeline` → entorno `actividad5-env` → *Next* → **Create pipeline**.

El pipeline corre solo la primera vez. Espera las 3 etapas en verde → **captura**. Abre la URL del entorno: ya no es la app de ejemplo sino la tuya, con el commit desplegado.

## Paso 5 · Probar el despliegue automático

En `src/app.js` cambia:

```js
const VERSION = '1.1.0';
const MENSAJE = 'Hola desde AWS CodePipeline · versión 2';
```

```powershell
npm test
git commit -am "Cambio el mensaje y subo la versión a 1.1.0"
git push
```

Sin tocar nada en AWS, el pipeline arranca solo (**captura** de la ejecución en curso y luego completa). Recarga la URL: mensaje nuevo, versión 1.1.0 y otro commit → **captura**.

**Extra para el video (opcional):** daña una prueba (por ejemplo cambia `'Hola, Daniel'` por `'Chao'` en el test), haz push y muestra que el pipeline **se detiene en Construcción** y no despliega. Revierte con `git revert HEAD` y push.

## Capturas para el informe

1. Resultado del script de permisos
2. Repo en GitHub con los archivos y el historial de commits
3. Entorno de Elastic Beanstalk en *Ok* (con LabRole y LabInstanceProfile visibles en *Configuration*)
4. Conexión GitHub en *Available*
5. Proyecto de CodeBuild (configuración) y su log con `npm test` en verde
6. Pestaña **Reports** de CodeBuild con las 5 pruebas
7. Pipeline con las 3 etapas en verde (primera ejecución)
8. App desplegada v1.0.0
9. Push del cambio + pipeline ejecutándose solo (historial de ejecuciones con el mensaje del commit)
10. App desplegada v1.1.0

## Guion del video (≤ 10 min)

| Min | Qué mostrar |
|---|---|
| 0:00–1:00 | Presentación y objetivo. Qué es CodePipeline: **etapas** (Fuente, Construcción, Despliegue), **acciones** dentro de cada etapa y **transiciones** entre ellas. |
| 1:00–2:30 | Código: `app.js`, pruebas, `buildspec.yml` (fases install, pre_build, build, post_build, reports, artifacts). `npm test` en local. |
| 2:30–4:00 | Servicios: Elastic Beanstalk (entorno, LabRole/LabInstanceProfile), conexión GitHub, proyecto CodeBuild. Mencionar S3 + CloudFront y CloudFormation como alternativas investigadas. |
| 4:00–5:30 | Configuración del pipeline: etapas y artefactos que pasan de una a otra. Primera ejecución en verde. |
| 5:30–8:30 | **Demostración**: cambio el mensaje, `git push`, el pipeline arranca solo, log de CodeBuild, reporte de pruebas, despliegue y la app con la versión nueva. |
| 8:30–10:00 | (Opcional) prueba fallida que detiene el pipeline. Conclusiones. |

## Plan B · Si CodePipeline está bloqueado

1. Haz igual los pasos 1 y 2 (repo + Elastic Beanstalk).
2. Copia `plan-b/ci-cd-github-actions.yml` a `.github/workflows/ci-cd.yml`.
3. En GitHub: *Settings → Secrets and variables → Actions* → crea `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` y `AWS_SESSION_TOKEN` con los valores de **AWS Details → AWS CLI: Show** del Learner Lab (vencen cada ~4 h: actualízalos al iniciar el lab).
4. Push → pestaña **Actions** muestra Fuente → Construcción → Despliegue.
5. En el informe explica el bloqueo con la captura del error y cómo el workflow cumple el mismo rol.

## Alternativa CodeCommit (si falla la conexión con GitHub)

En CloudShell:

```bash
aws codecommit create-repository --repository-name actividad5-pipeline
pip install --user git-remote-codecommit
# sube la carpeta del proyecto en .zip (Actions → Upload file) y descomprímela
unzip actividad5.zip -d actividad5 && cd actividad5
git init -b main && git add . && git commit -m "App inicial"
git remote add origin codecommit::us-east-1://actividad5-pipeline
git push -u origin main
```

En el paso 4 elige *Source: AWS CodeCommit*. Los cambios del paso 5 se hacen y empujan desde CloudShell.

## Limpieza (cuando te califiquen)

Borra el pipeline, el proyecto de CodeBuild y el entorno de Elastic Beanstalk para no gastar créditos.
