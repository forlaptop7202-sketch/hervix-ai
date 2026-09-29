const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function isEnglish(text) {
    // Urdu script check
    const urduScript = /[\u0600-\u06FF]/;
    if (urduScript.test(text)) return false;

    // Roman Urdu words check
    const romanUrduWords = ["ap", "kya", "kia", "hai", "ha", "haa", "ho",
        "hy", "hain", "main", "mujhe", "mujhy", "kr", "kar", "karo",
        "aur", "nahi", "nhi", "bhi", "se", "ko", "ka", "ki", "tha",
        "thi", "yeh", "ye", "wo", "woh", "theek", "thik", "haal", "hal",
        "bat", "baat", "sab", "ek", "bas", "bilkul", "kab", "kahan",
        "kyun", "nikl", "niklo", "aya", "gaya", "yar", "yr", "bhai",
        "achi", "acha", "lagta", "pata", "pta", "wala", "wali", "kesy",
        "kaise", "kaisa", "assalamualikum", "salam", "bolo", "btao",
        "batao", "chahta", "chahti", "krna", "karna", "rha", "raha",
        "mera", "meri", "tera", "teri", "apna", "apni", "kuch", "koi",
        "tum", "hum", "sy", "py", "pe", "hen", "hn", "mn", "ny", "ne"];

    const words = text.toLowerCase().split(/\s+/);
    const count = words.filter(w => romanUrduWords.includes(w)).length;
    if (count > 0) return false;

    return true;
}

app.post("/chat", async (req, res) => {
    try {
        const message = (req.body.message || "").trim();

        if (!message) {
            return res.json({ reply: "Please type a message." });
        }

        // Agar English nahi hai to seedha message do
        if (!isEnglish(message)) {
            return res.json({
                reply: "I can only reply in English. I only understand English, please write in English! 😊"
            });
        }

        const response = await fetch(
            "http://localhost:11434/api/chat",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "qwen2.5:7b",
                    stream: false,
                    messages: [
                        {
                            role: "system",
                            content: `You are HERVIX AI, created by Hassan Here.
ALWAYS reply in English only.
Keep replies short, friendly and helpful.
Never say Namaste. Use Hello or Hi instead.
Never show thinking or reasoning. Only give final answer.`
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    options: {
                        temperature: 0.1,
                        num_predict: 150
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error("Ollama error: " + response.status);
        }

        const data = await response.json();
        let reply = data.message?.content || "";

        const thinkEnd = reply.toLowerCase().lastIndexOf("</think>");
        if (thinkEnd !== -1) {
            reply = reply.substring(thinkEnd + "</think>".length).trim();
        }
        reply = reply.replace(/<think>/gi, "").trim();

        if (!reply) {
            reply = "Sorry, I could not get a response.";
        }

        res.json({ reply: reply });

    } catch (error) {
        console.error("HERVIX ERROR:", error);
        res.status(500).json({
            reply: "⚠️ HERVIX AI se connection nahi ho raha."
        });
    }
});

app.listen(PORT, () => {
    console.log(`🔥 HERVIX AI running at http://localhost:${PORT}`);
});