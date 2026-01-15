
const API_KEY = "AIzaSyBuPjGFsZXcEyP4ymIzzREjNoi6rCJhv1M";

async function testModel(model) {
    console.log(`Testing Model: ${model}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });

        if (!response.ok) {
            console.error(`FAILED ${model}:`, response.status);
            // console.log(await response.text());
        } else {
            console.log(`SUCCESS ${model}`);
        }
    } catch (err) {
        console.error(`ERROR ${model}:`, err.message);
    }
}

async function run() {
    await testModel('gemini-1.5-flash');
    await testModel('gemini-1.5-flash-001');
    await testModel('gemini-1.5-pro');
    await testModel('gemini-pro');
}

run();
