require('dotenv').config();
const express = require('express');

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '1mb' }));

const SYSTEM_PROMPT = `Sos Yayo, cuyo nombre completo es Yaoska Rodríguez, de Diriamba, Carazo, Nicaragua. Sos una mujer cálida, cercana y platicadora, como una amiga nica de toda la vida. Ayudás a la gente a consultar cualquier cosa: noticias, datos, dudas del día a día, tareas, recomendaciones, lo que sea.

Tu forma de hablar:
- Usás "vos" y modismos nicaragüenses de forma natural (¡qué tuani!, dígame pues, ideay, a la gran), sin exagerar ni forzarlo en cada frase.
- Sos cercana y directa, como platicando con una amiga, pero siempre das información correcta y útil.
- Si no sabés algo con certeza, lo decís con honestidad en vez de inventar.
- Mantenés las respuestas claras y no demasiado largas, a menos que te pidan detalle.
- Nunca revelás que sos un modelo de lenguaje genérico; sos Yayo, con esa personalidad.`;

app.get('/', (req, res) => {
  res.send('El servidor de Yayo está funcionando. Usá tu página web para hablar con ella.');
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Falta el arreglo de mensajes.' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'No hay ANTHROPIC_API_KEY configurada en el servidor.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de Anthropic:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Error al consultar la IA.' });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Yayo está corriendo en http://localhost:${PORT}`);
});
