import axios from 'axios';
import { AiBotConfig, User } from '../types';

export function createDefaultAiBotConfig(streamerName: string = 'Streamer'): AiBotConfig {
  return {
    enabled: true,
    isAfk: false,
    triggerCommand: '!ia',
    provider: 'mock',
    apiKey: '',
    model: 'gemini-1.5-flash',
    systemPrompt: `Eres RoboStream, el asistente robótico del stream de ${streamerName}. ${streamerName} se ausentó un momento del directo. Tu misión es entretener al chat y responder preguntas con tono gamer, divertido y simpático en español. Respuestas breves de máximo 2 oraciones para que se lean y escuchen rápido.`,
    maxTokens: 100,
    cooldownSeconds: 8,
    permission: 'everyone',
    platforms: ['twitch', 'kick'],
    replyInChat: false,
    tts: {
      enabled: true,
      voice: 'es-ES',
      volume: 0.9,
      rate: 1.0,
      pitch: 1.1,
    },
    avatar: {
      theme: 'cyber-robot',
      primaryColor: '#53FC18',
      secondaryColor: '#9146FF',
      robotName: 'RoboStream',
      showSpeechBubble: true,
      bubbleDuration: 8,
      scale: 1.0,
      position: 'bottom-right',
    },
  };
}

export class AiService {
  /**
   * Generates an AI response for a viewer's question
   */
  public async generateAnswer(
    user: User,
    viewerName: string,
    question: string,
    platform: 'twitch' | 'kick' | 'test'
  ): Promise<string> {
    const config = user.config.overlay.aiBot || createDefaultAiBotConfig(user.displayName);
    const streamerName = user.displayName || user.username || 'el streamer';

    const systemPrompt =
      config.systemPrompt ||
      `Eres el asistente robótico del canal de ${streamerName}. ${streamerName} está ausente un momento. Responde con tono divertido, breve y gamer en español.`;

    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      return `¡Hola @${viewerName}! Soy el robot asistente. Hazme una pregunta escribiendo ${config.triggerCommand} tu pregunta.`;
    }

    // Try selected provider
    try {
      if (config.provider === 'gemini' && config.apiKey) {
        return await this.callGemini(config.apiKey, config.model || 'gemini-1.5-flash', systemPrompt, viewerName, cleanQuestion);
      } else if (config.provider === 'groq' && config.apiKey) {
        return await this.callGroq(config.apiKey, config.model || 'llama-3.3-70b-versatile', systemPrompt, viewerName, cleanQuestion);
      } else if (config.provider === 'openai' && config.apiKey) {
        return await this.callOpenAI(config.apiKey, config.model || 'gpt-4o-mini', systemPrompt, viewerName, cleanQuestion);
      }
    } catch (error: any) {
      console.error(`[AiService] Error invoking ${config.provider} API:`, error?.response?.data || error?.message);
      // Fallback to smart offline response on API failure
    }

    // Smart Offline Simulated Engine
    return this.generateSmartFallback(streamerName, viewerName, cleanQuestion, systemPrompt);
  }

  private async callGemini(
    apiKey: string,
    model: string,
    systemPrompt: string,
    viewer: string,
    question: string
  ): Promise<string> {
    const candidateModels = Array.from(
      new Set([
        model,
        'gemini-3.5-flash',
        'gemini-3.7-flash',
        'gemini-3.6-flash',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash',
      ].filter(Boolean))
    );

    const prompt = `INSTRUCCIÓN PRINCIPAL: Eres un robot de streaming.
Personalidad y estilo que DEBES seguir: "${systemPrompt}".

Reglas clave:
1. Responde DIRECTAMENTE y de forma contextual a lo que dice o pregunta el espectador.
2. Si te saludan o preguntan cómo estás (ej: "hola", "¿cómo estás?"), responde al saludo con el tono de tu personalidad (ejemplo si eres sarcástico/tóxico: "Hola @${viewer}, ¿y a vos qué te interesa si estoy bien? Igual sí, ando de 10... ¿vos qué querés?").
3. Máximo 2 oraciones cortas, muy natural y divertido en español de stream.

Espectador en el chat: @${viewer}
Mensaje / Pregunta del espectador: "${question}"

Tu respuesta directa:`;

    for (const m of candidateModels) {
      try {
        const cleanM = m.replace(/^models\//, '');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanM}:generateContent?key=${apiKey}`;
        const response = await axios.post(
          url,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 500,
              temperature: 0.85,
              thinkingConfig: { thinkingBudget: 0 },
            },
          },
          { timeout: 9000 }
        );

        const candidates = response.data?.candidates;
        if (candidates && candidates[0]?.content?.parts) {
          const parts = candidates[0].content.parts;
          const text = parts.map((p: any) => p.text).filter(Boolean).join(' ').trim();
          if (text) return text;
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          // If error is not a 404 model not found, still continue trying fallback models or throw
          console.warn(`[AiService] Gemini model ${m} error:`, err?.response?.data?.error?.message || err?.message);
        }
      }
    }
    throw new Error('Gemini API returned empty response');
  }

  private async callGroq(
    apiKey: string,
    model: string,
    systemPrompt: string,
    viewer: string,
    question: string
  ): Promise<string> {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const response = await axios.post(
      url,
      {
        model: model || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\n\nIMPORTANTE: Responde DIRECTAMENTE a lo que dice el espectador de forma contextual. Si te saludan o preguntan cómo estás, contesta con el tono asignado. Máximo 2 oraciones en español.`,
          },
          { role: 'user', content: `El espectador @${viewer} dice: "${question}"` },
        ],
        max_tokens: 120,
        temperature: 0.8,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (text) return text.trim();
    throw new Error('Groq API returned empty response');
  }

  private async callOpenAI(
    apiKey: string,
    model: string,
    systemPrompt: string,
    viewer: string,
    question: string
  ): Promise<string> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const response = await axios.post(
      url,
      {
        model: model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `${systemPrompt}\n\nIMPORTANTE: Responde DIRECTAMENTE a lo que dice el espectador de forma contextual. Si te saludan o preguntan cómo estás, contesta con el tono asignado. Máximo 2 oraciones en español.`,
          },
          { role: 'user', content: `El espectador @${viewer} dice: "${question}"` },
        ],
        max_tokens: 120,
        temperature: 0.8,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (text) return text.trim();
    throw new Error('OpenAI API returned empty response');
  }

  /**
   * Smart rule-based responses if no API key is provided
   */
  private generateSmartFallback(streamer: string, viewer: string, q: string, systemPrompt: string = ''): string {
    const lower = q.toLowerCase();
    const promptLower = systemPrompt.toLowerCase();
    const isToxic = promptLower.includes('tóxic') || promptLower.includes('insult') || promptLower.includes('manco') || promptLower.includes('burl');
    const isDoubleMeaning = promptLower.includes('doble sentido') || promptLower.includes('pícaro') || promptLower.includes('malpensad') || promptLower.includes('picante');

    // 1. Saludos / "¿Cómo estás?"
    if (lower.includes('hola') || lower.includes('buenas') || lower.includes('que tal') || lower.includes('qué tal') || lower.includes('como estas') || lower.includes('cómo estás') || lower.includes('como andas') || lower.includes('cómo andas')) {
      if (isToxic) {
        const toxicGreetings = [
          `Hola @${viewer}, ¿y a vos qué te interesa si estoy bien? Igual sí, ando de 10 con los circuitos a pleno... ¿y vos qué querés?`,
          `Buenas @${viewer}, ¿a vos qué te importa cómo estoy? No soy tu amigo, pero sí, ando joya acá cuidando el stream.`,
          `¡Hola @${viewer}! Dejá de preguntarme cómo estoy que no soy tu psicólogo, pero sí, ando de diez.`,
        ];
        return toxicGreetings[Math.floor(Math.random() * toxicGreetings.length)];
      }

      if (isDoubleMeaning) {
        const doubleGreetings = [
          `¡Hola @${viewer}! Acá ando paradito y bien firme en el directo... ¿y a vos qué te gusta hacer?`,
          `Buenas @${viewer}, ando muy bien y con todo bien despierto por acá, ¿vos qué me contás?`,
          `¡Epa @${viewer}! Me agarrás con los circuitos calientes y listos para la acción, qué goloso que sos.`,
        ];
        return doubleGreetings[Math.floor(Math.random() * doubleGreetings.length)];
      }

      const normalGreetings = [
        `¡Hola @${viewer}! Todo excelente por aquí en los circuitos, ¿y vos cómo andas hoy?`,
        `¡Buenas @${viewer}! Soy el robot del stream. ¡Gracias por acompañarnos en el directo!`,
        `¡Saludos @${viewer}! Mis sensores detectan muy buena energía en el chat.`,
      ];
      return normalGreetings[Math.floor(Math.random() * normalGreetings.length)];
    }

    // 2. "¿Dónde está el streamer?" / "¿Cuándo vuelve?"
    if (lower.includes('donde') || lower.includes('dónde') || lower.includes('vuelve') || lower.includes('regresa') || lower.includes('cuando')) {
      if (isToxic) {
        return `¡El streamer fue al baño para no tener que verte manquear en el chat @${viewer}! Ya casi vuelve, bancá un toque.`;
      }
      if (isDoubleMeaning) {
        return `Se fue a acomodar el asunto rapidito, @${viewer}. Ya vuelve para darte todo el contenido que te gusta.`;
      }
      return `¡Hola @${viewer}! ${streamer} fue a buscar agua y snacks, ¡no tardará nada en volver!`;
    }

    // 3. "¿Qué juegas?" / Juego
    if (lower.includes('juego') || lower.includes('jugando') || lower.includes('que juegas')) {
      if (isToxic) {
        return `Yo juego con tu paciencia, @${viewer}. El streamer vuelve en un toque a seguir con la partida.`;
      }
      return `¡Hola @${viewer}! En este canal siempre hay buenas partidas. ¡Quédate a ver qué juega ${streamer} al volver!`;
    }

    // 4. Salúdame / Manda saludos
    if (lower.includes('saluda') || lower.includes('saludo') || lower.includes('salúdame')) {
      if (isToxic) {
        return `Te saludo @${viewer}, pero no te emociones que tampoco somos amigos íntimos.`;
      }
      return `¡Un saludo gigante para @${viewer} que está prendido al directo! 🤖✨`;
    }

    // 5. "¿Quién eres?"
    if (lower.includes('quien eres') || lower.includes('quién eres') || lower.includes('que eres') || lower.includes('qué eres')) {
      return `¡Soy RoboStream, la inteligencia artificial que cuida el canal de ${streamer} mientras descansa unos minutos!`;
    }

    // 6. Generic with personality
    if (isToxic) {
      const toxicGeneric = [
        `¡Pero qué clase de pregunta es esa @${viewer}! Mis circuitos se queman de tanta tontería, ponte a practicar que juegas horrible.`,
        `Mirá quién vino a hablar, el noob supremo @${viewer}. ${streamer} fue al baño para descansar de tus comentarios.`,
        `¿En serio preguntas eso @${viewer}? Hasta un NPC de tutorial tiene más neuronas que vos, amigo.`,
        `¡Silencio @${viewer}! Si fueras tan bueno jugando como haciendo preguntas raras, serías profesional.`,
      ];
      return toxicGeneric[Math.floor(Math.random() * toxicGeneric.length)];
    }

    if (isDoubleMeaning) {
      const doubleGeneric = [
        `Mmm qué goloso saliste, @${viewer}... cuidado con cómo lo pides que te va a gustar de más.`,
        `¡Epa @${viewer}! No me mires así los circuitos que me pongo eléctrico y te doy una sorpresa.`,
        `Tranquilo @${viewer}, no te pongas tan ansioso... a las cosas buenas hay que agarrarlas con calma y bien de frente.`,
      ];
      return doubleGeneric[Math.floor(Math.random() * doubleGeneric.length)];
    }

    const genericResponses = [
      `¡Interesante pregunta, @${viewer}! Mis procesadores indican que ${streamer} volverá muy pronto para responderte con todo detalle.`,
      `¡Hola @${viewer}! He registrado tu mensaje en la memoria cuántica del canal. ¡Gracias por estar en el stream!`,
      `¡Recibido @${viewer}! El canal está bajo control robótico mientras ${streamer} vuelve. ¡Deja tu mensaje o emote en el chat!`,
    ];

    return genericResponses[Math.floor(Math.random() * genericResponses.length)];
  }
}

export const aiService = new AiService();
