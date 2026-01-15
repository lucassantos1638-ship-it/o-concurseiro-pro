
const API_KEY = "AIzaSyBuPjGFsZXcEyP4ymIzzREjNoi6rCJhv1M";

async function listModels() {
    console.log("Listing Models...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const text = await response.text();
            console.error("List Models Failed:", response.status, text);
        } else {
            const data = await response.json();
            const geminiModels = data.models.filter(m => m.name.includes("gemini"));
            if (geminiModels.length > 0) {
                console.log("FIRST_MODEL: " + geminiModels[0].name);
            } else {
                console.log("NO GEMINI MODELS FOUND");
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

listModels();
