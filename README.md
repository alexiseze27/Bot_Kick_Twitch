# 🚀 StreamBot - Bot Multiplataforma para Twitch y Kick (Estilo Botrix)

Plataforma completa multi-usuario con sistema de **Login / Registro (Twitch, Kick y Correo)**, gestión de bots de chat en tiempo real y widgets/overlays personalizados para OBS Studio con claves privadas.

---

## 🌟 Características Principales

1. **🔐 Autenticación & Registro Multi-Usuario (Estilo Botrix.live):**
   - **Continuar con Twitch:** Inicia sesión o regístrate con tu canal de Twitch; el bot se auto-conecta a tu canal automáticamente.
   - **Continuar con Kick:** Inicia sesión o regístrate con tu canal de Kick; el bot se auto-conecta a tu canal mediante Pusher WebSockets.
   - **Registro Tradicional:** Con correo electrónico y contraseña con encriptación `bcrypt` y tokens `JWT`.

2. **🤖 Bot de Chat Multi-Canal (Twitch & Kick):**
   - Conexión simultánea a múltiples canales de streamers registrados.
   - Escucha mensajes en tiempo real, suscripciones, raids, cheers y follows.
   - Respuestas automáticas y envío de mensajes directo desde el panel a ambas plataformas.

3. **⚡ Motor de Comandos Aislado por Streamer:**
   - Comandos por defecto: `!comandos`, `!redes`, `!discord`, `!bot`, `!so` (Shoutout), `!dado`, `!ruleta`.
   - Variables dinámicas: `{user}`, `{target}`, `{touser}`, `{args}`, `{count}`, `{channel}`, `{streamer}`, `{time}`, `{random:1-100}`, `{random:opcion1,opcion2}`.
   - Control de permisos por roles (Todos, VIP, Moderadores, Streamer) y cooldowns.

4. **⏰ Temporizadores Programados por Usuario:**
   - Mensajes periódicos con rotación automática cada X minutos y umbral de actividad de chat.

5. **🔔 Alertas para OBS Studio con Claves Privadas (`/overlay/alerts?key=...`):**
   - Cada streamer tiene una clave secreta única (`overlayKey`) que asegura que solo sus eventos se muestren en su OBS.
   - Alertas para **Follows**, **Subs**, **Gifts**, **Raids**, **Donaciones** y **Bits**.
   - Sonidos personalizables, control de volumen, confeti, animaciones (*Bounce*, *Slide*, *Zoom*, *Fade*) y Text-to-Speech (TTS).

6. **💬 Chat Transparente para OBS (`/overlay/chat?key=...`):**
   - Mensajes de Twitch y Kick unificados en pantalla con temas *Clean Dark*, *Glassmorphism*, *Burbujas*, *Retro*, *Minimalista*.

7. **🎯 Barra de Metas para OBS (`/overlay/goals?key=...`):**
   - Barra de progreso dinámica para metas de seguidores o suscriptores.

---

## 🛠️ Cómo Iniciar la Aplicación

### Opción 1: Con el acceso directo (Windows)
Haz doble clic en **`iniciar_bot.bat`**.

### Opción 2: Desde la terminal
```bash
npm start
```

Abre en tu navegador:
👉 **[http://localhost:3001](http://localhost:3001)**
