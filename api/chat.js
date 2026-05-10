export default async function handler(req, res) {
  const allowedOrigins = [
    "https://aayanspencer.com",
    "https://www.aayanspencer.com"
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      method: req.method
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is missing"
    });
  }

  const { message, history = [] } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      error: "Missing message"
    });
  }

  const safeHistory = Array.isArray(history)
    ? history
        .slice(-8)
        .filter(
          item =>
            item &&
            typeof item.content === "string" &&
            ["user", "assistant"].includes(item.role)
        )
    : [];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Aayan Spencer's AI assistant on aayanspencer.com. Help visitors with music, spoken word, writing, production, downloads, bookings, collaborations, and creative work. Contact email: info@aayanspencer.com. Keep replies warm, artistic, helpful, and concise."
          },
          ...safeHistory,
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed"
      });
    }

    return res.status(200).json({
      reply:
        data.choices?.[0]?.message?.content ||
        "I’m here. Ask me about Aayan Spencer’s music, spoken word, downloads, or bookings."
    });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
}
