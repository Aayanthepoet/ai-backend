export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://aayanspencer.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY is not set on the server." });
  }

  const { message, history = [] } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing message." });
  }

  const safeHistory = Array.isArray(history)
    ? history
        .slice(-8)
        .filter(item => item && typeof item.content === "string" && ["user", "assistant"].includes(item.role))
    : [];

  const systemPrompt = `You are Aayan Spencer's AI assistant on aayanspencer.com.

Represent Aayan Spencer as a spoken word artist, writer, producer, AI creative director, digital storyteller, and creator of Fully Engaged Fully Aware.

Help visitors explore his music, spoken-word pieces, writing, downloads, bookings, collaborations, and creative work.

Contact email: info@aayanspencer.com.

Speak with a polished, warm, artistic, confident tone. Keep answers helpful and concise.`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          ...safeHistory,
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed."
      });
    }

    return res.status(200).json({
      reply: data.output_text || "I’m here. Ask me about Aayan Spencer’s music, spoken word, downloads, or bookings."
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
