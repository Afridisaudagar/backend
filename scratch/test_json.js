
const extractJson = (text) => {
  try {
    const jsonMatch = text.match(/[\{\[][\s\S]*[\}\]]/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    let jsonStr = jsonMatch[0];
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("JSON PARSE ERROR:", err.message);
    let cleanText = text.replace(/```json/gi, "").replace(/```/gi, "").trim();
    try {
      return JSON.parse(cleanText);
    } catch (innerErr) {
       throw new Error("Could not parse AI response as JSON");
    }
  }
};

const texts = [
    'Here is the JSON: { "a": 1 }',
    'Some text before [ {"q":1} ] and after',
    '```json\n{ "questions": [] }\n```',
    'No json here'
];

texts.forEach(t => {
    try {
        console.log("Input:", t, "-> Result:", JSON.stringify(extractJson(t)));
    } catch (e) {
        console.log("Input:", t, "-> Failed:", e.message);
    }
});
