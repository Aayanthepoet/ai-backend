export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://aayanspencer.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is missing"
    });
  }

  const { message, history = [] } = req.body || {};

  if (!message) {
    return res.status(400).json({
      error: "Missing message"
    });
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
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
                "You are Aayan Spencer's AI assistant. Help visitors with music, spoken word, bookings, collaborations, and creative work."
            },
            ...history,
            {
              role: "user",
              content: message
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      "I’m here to help.";

    return res.status(200).json({
      reply
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
