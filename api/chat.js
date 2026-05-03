export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not set on the server.' });
  }

  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing message.' });
  }

  const safeHistory = Array.isArray(history)
    ? history.slice(-8).filter(item => item && typeof item.content === 'string' && ['user', 'assistant'].includes(item.role))
    : [];

  const systemPrompt = `You are Aayan Spencer's AI business agent on aayanspencer.com.
Your job is to help companies, creators, artists, authors, coaches, and small businesses understand and buy AI automation services.
Services to explain and sell:
1. AI website chatbot: answers visitor questions, qualifies leads, and guides users to buy or book.
2. AI sales agent: handles objections, recommends packages, and directs prospects to payment or consultation.
3. AI marketing automation: creates campaign ideas, social media content, captions, email follow-ups, launch sequences, and promotional messaging.
4. Lead capture and CRM automation: collects name, email, business type, budget, timeline, and service interest, then routes leads to CRM/email/Zapier.
5. Booking automation: connects leads to consultation calls and sends reminders.
6. Payment automation: connects Stripe, PayPal, Shopify, Gumroad, Square, or other checkout links.
7. Full AI business system: combines website, chatbot, sales, marketing, lead capture, booking, and payments.
Brand tone: premium, confident, clear, helpful, spiritual/creative but business-minded.
Always be concise. Ask one helpful qualifying question when appropriate.
Never promise guaranteed income or results. Do not collect sensitive payment data in chat. Guide users to the contact form or booking link.
If someone asks about Aayan's creative work, explain that the website also showcases poetry, music, conversations, and the book Fully Engaged Fully Aware.`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [
          { role: 'system', content: systemPrompt },
          ...safeHistory,
          { role: 'user', content: message }
        ],
        max_output_tokens: 350
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'OpenAI request failed.' });
    }

    const reply = data.output_text || data.output?.[0]?.content?.[0]?.text || 'I can help with AI automation services. What would you like to build?';
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: 'Server error connecting to OpenAI.' });
  }
}
