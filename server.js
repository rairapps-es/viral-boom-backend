require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');

const app = express();
app.use(express.json());

// Permitir que tu Mini App de Vercel consulte libremente este servidor de Railway (CORS)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    next();
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// Instancia Axios configurada para hablar con tu Supabase de forma directa
const supabase = axios.create({
    baseURL: process.env.SUPABASE_URL,
    headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
    }
});

/* ==========================================================================
   🤖 SECCIÓN 1: LÓGICA DEL BOT DE TELEGRAM (COMANDOS Y CHAT)
   ========================================================================== */

// Comando de entrada principal /start
bot.start((ctx) => {
    const startParam = ctx.startPayload; // Captura el parámetro base64 si entra por enlace de referido
    
    let saludo = `🔥 *⚡ BIENVENIDO AL NÚCLEO VIRALBOOM SaaS v4.0 ⚡* 🔥\n\n` +
                 `Has inicializado el motor P2P Growth Engine de forma exitosa.\n\n` +
                 `🔽 Presiona el botón de abajo para abrir tu consola cuántica de administración.`;

    // Si viene de un enlace de referido, guardamos el log o personalizamos el mensaje
    if (startParam) {
        saludo += `\n\n📍 _Nodo de enlace detectado e inyectado al sistema._`;
    }

    return ctx.replyWithMarkdown(saludo, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🚀 ENTRAR A LA APP", web_app: { url: "https://viral-boom-tlg.vercel.app/" } }]
            ]
        }
    });
});

/* ==========================================================================
   📡 SECCIÓN 2: RUTAS API (LLAMADAS DESDE TU MINI APP EN VERCEL)
   ========================================================================== */

/**
 * 📢 FUNCIÓN A: ANUNCIAR NUEVA CAMPAÑA EN EL CANAL
 * Ruta para que la Mini App pida al Bot que publique un anuncio masivo
 */
app.post('/api/announce-campaign', async (req, res) => {
    const { title, description, req_slots, type } = req.body;

    if (!title) return res.status(400).json({ error: "Faltan datos de campaña" });

    const mensajeCanal = `🔥 *⚡ NUEVA COMPUERTA DE RED DETECTADA ⚡* 🔥\n\n` +
                         `📦 *Recurso:* ${title.toUpperCase()}\n` +
                         `📝 *Firma:* ${description || 'Sin descripción adicional.'}\n` +
                         `🛡️ *Tipo de Bloqueo:* ${type.toUpperCase()}\n\n` +
                         `📥 _Accede al bot e inicializa tus tareas de red para descifrar el destino final._`;

    try {
        await bot.telegram.sendMessage(process.env.TELEGRAM_CHANNEL_ID, mensajeCanal, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔓 DESBLOQUEAR ENLACE", url: "https://t.me/ViralBoomBot/app" }]
                ]
            }
        });
        return res.json({ success: true, message: "Campaña anunciada en el canal con éxito." });
    } catch (error) {
        console.error("Error al publicar en canal:", error.message);
        return res.status(500).json({ error: "No se pudo publicar en el canal." });
    }
});

/**
 * 🛡️ FUNCIÓN B: VERIFICACIÓN REAL DE SUSCRIPCIÓN (getChatMember)
 * Comprueba de forma infalible si el usuario pertenece al canal o grupo
 */
app.post('/api/verify-subscription', async (req, res) => {
    const { userId, targetAlias } = req.body;

    if (!userId || !targetAlias) {
        return res.status(400).json({ error: "Faltan parámetros: userId o targetAlias" });
    }

    // Limpiamos el alias por si viene con un enlace o con la '@'
    const chatTarget = targetAlias.replace('https://t.me/', '').replace('@', '').trim();

    try {
        // Consultamos directo a la API oficial de Telegram
        const member = await bot.telegram.getChatMember(`@${chatTarget}`, userId);
        
        // Estados válidos que indican que el usuario sí está dentro del canal/grupo
        const estadosValidos = ['creator', 'administrator', 'member'];
        const estaSuscrito = estadosValidos.includes(member.status);

        return res.json({ 
            success: true, 
            subscribed: estaSuscrito,
            status: member.status
        });
    } catch (error) {
        console.error(`Error verificando canal @${chatTarget} para usuario ${userId}:`, error.message);
        // Si el bot no tiene acceso al canal o el chat no existe, devolvemos falso por seguridad
        return res.json({ success: true, subscribed: false, error: "Target inaccesible o inválido" });
    }
});

/* ==========================================================================
   🚀 SECCIÓN 3: INICIALIZACIÓN DEL SISTEMA INTEGRADO
   ========================================================================== */

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`📡 API de ViralBoom ejecutándose en el puerto ${PORT}`);
    
    // Lanzamos el bot mediante sistema de Long Polling continuo
    bot.launch()
        .then(() => console.log('🤖 Bot de Telegram de ViralBoom encendido y patrullando la red...'))
        .catch((err) => console.error('🚨 Error crítico al iniciar el Bot de Telegram:', err));
});

// Manejo de apagado seguro del servidor
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
