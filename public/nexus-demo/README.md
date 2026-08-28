# Nexus Empresarial - Demo Interactiva

## 📋 Descripción

**Nexus Empresarial** es una plataforma interactiva de demostración que automatiza el cumplimiento normativo del Sistema de Recursos Contratados (SRC) de YPF.

### Archivos Incluidos

- **index.html** — Hub principal con panel de usuarios, guía de uso, FAQ y seguridad
- **nexus-pitch-demo.html** — Aplicación interactiva con 4 roles (Administrador, Auditor, Empresa, Inspector YPF)
- **informe-ejecutivo-nexus.html** — Reporte ejecutivo profesional con KPIs y análisis

---

## 🚀 Cómo Usar

### Opción 1: Desde el Navegador (Recomendado)

1. **Descarga los 3 archivos** en una carpeta
2. **Abre `index.html`** haciendo doble clic
3. Selecciona "Demo Interactiva" para acceder a la app
4. Usa las credenciales de la pestaña "Usuarios Prueba"

### Opción 2: Desde un Servidor Web

```bash
# Si tienes Python 3 instalado
python -m http.server 8000

# Si tienes Node.js con http-server
npx http-server

# Luego abre en tu navegador:
# http://localhost:8000
```

### Opción 3: Uso Offline Completo

1. Descarga los 3 archivos
2. Desactiva la conexión a internet (opcional)
3. Abre `index.html` directamente en tu navegador
4. La app funciona completamente offline

---

## 👥 Usuarios de Prueba

Cada rol tiene permisos específicos. Los datos son ficticios y solo de demostración.

### Administrador
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Permisos:** Acceso total, gestión de usuarios, reportes

### Auditor
- **Usuario:** `lucia`
- **Contraseña:** `lucia123`
- **Permisos:** Ver todas las empresas, auditar, generar reportes

### Empresa Contratista
- **Usuario:** `codesin`
- **Contraseña:** `codesin123`
- **Permisos:** Gestionar recursos propios, cargar documentación

### Inspector YPF
- **Usuario:** `inspector`
- **Contraseña:** `inspector123`
- **Permisos:** Validar recursos, aprobar OTs, generar alertas

---

## 🔒 Seguridad y Privacidad

### ✓ Información de Datos

- **Sin conexión a servidores:** Todo ocurre en tu navegador
- **Datos locales:** Se guardan solo en `localStorage` de tu navegador
- **Sin rastreo:** No hay cookies de rastreo ni analíticas externas
- **Credenciales ficticias:** Las credenciales son solo para demostración
- **Fácil de limpiar:** Limpia `localStorage` desde los ajustes del navegador

### ✓ Verificación

Para verificar que no hay conexiones remotas:

1. Abre `nexus-pitch-demo.html` en tu navegador
2. Presiona `F12` para abrir Desarrollador
3. Abre la pestaña "Network"
4. Interactúa con la app
5. Verás que **no hay peticiones HTTP a servidores externos**

### ✓ Cómo Limpiar Datos Locales

**Chrome/Firefox/Edge:**
1. Abre el archivo en tu navegador
2. Presiona `F12` → "Application" → "localStorage"
3. Selecciona la entrada y presiona "Delete"

O simplemente limpia el historial de navegación completo.

---

## 🌐 Requisitos de Navegador

Nexus funciona en navegadores modernos con soporte para ES6 y localStorage:

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ❌ Internet Explorer 11 (no compatible)

---

## 📋 Funcionalidades Principales

### Demo Interactiva

- **Recursos & OT:** Clasificación de órdenes de trabajo y requisitos documentales
- **Aprobaciones:** Flujo Nuevo → Pendiente Inspector → Aprobada → Avalado
- **Accesos:** Habilitaciones y cursos CILP/Y-TEC
- **Vigencias:** Alertas de vencimiento y aplicación mensual
- **Comunicaciones:** OS/PE y proceso de bajas
- **Control:** Semáforo de cumplimiento por recurso y empresa
- **Auditoría:** Generación de reportes semanales en Excel

### Reporte Ejecutivo

- KPIs de cumplimiento
- Gráficos de tendencias
- Matriz de conformidad por empresa
- Recomendaciones estratégicas
- Exportable a PDF (Ctrl+P)

---

## 💾 Cómo Descargar Reportes

### Reporte en Excel

1. En la demo, ve a "Auditoría"
2. Haz clic en "Generar Reporte Semanal"
3. Haz clic en "Descargar Reporte (XLSX)"
4. El navegador descargará un archivo Excel

### Reporte Ejecutivo en PDF

1. Abre "Reporte Ejecutivo"
2. Presiona `Ctrl+P` (Windows/Linux) o `Cmd+P` (Mac)
3. Selecciona "Guardar como PDF"
4. El navegador guardará el PDF

---

## ⚠️ Disclaimer

**Nexus Empresarial es una demo interactiva, NO es una plataforma de producción.**

Esta herramienta está diseñada para:
- ✓ Demostración de conceptos
- ✓ Capacitación y entrenamiento
- ✓ Validación de funcionalidades

**NO debe usarse para:**
- ❌ Manejar datos reales o sensibles
- ❌ Implementación en producción sin auditoría de seguridad
- ❌ Reemplazo de sistemas de producción

Si implementas un sistema similar en producción, asegúrate de incluir:
- Autenticación y autorización real (OAuth, OIDC)
- Encriptación end-to-end
- Auditoría y logging completo
- Cumplimiento normativo (GDPR, CCPA, etc.)
- Respaldo de datos y disaster recovery
- Penetration testing y security review

---

## 🛠️ Troubleshooting

### "La app no carga"
- Verifica que uses un navegador moderno (Chrome, Firefox, Safari, Edge)
- Abre la consola (F12) y busca errores
- Intenta con otro navegador

### "Los datos no se guardan"
- Asegúrate de que `localStorage` esté habilitado en tu navegador
- No estés usando una ventana privada/incógnita (localStorage no funciona)
- Limpia el cache del navegador (Ctrl+Shift+Del)

### "No puedo descargar Excel"
- Necesitas conexión a internet para la descarga de Excel
- Si usas un servidor local, asegúrate de que esté ejecutándose

### "La pantalla se ve cortada"
- Intenta redimensionar la ventana del navegador
- Zoomea (Ctrl+0 para restaurar zoom)
- Usa un navegador más moderno

---

## 📞 Soporte

Para preguntas sobre la demo:
1. Revisa la pestaña "FAQ" en `index.html`
2. Consulta la pestaña "Guía de Uso" para paso a paso
3. Verifica la pestaña "Seguridad" para información de privacidad

---

## 📄 Licencia

Nexus Empresarial es una demostración. El código fuente está completamente visible y puedes modificarlo libremente.

---

**Última actualización:** Agosto 2026  
**Versión:** 1.0 Demo  
**Estado:** Completamente funcional - Solo para demostración
