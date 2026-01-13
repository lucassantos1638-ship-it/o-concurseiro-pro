interface ParsedConcurso {
    concurso: {
        nome: string;
        banca: string;
        orgao: string;
        salario_maximo: string;
        total_vagas: number;
        cidades: string[]; // Usar lista de estados/cidades identificados
        observacoes: string;
    };
    cargos: Array<{
        nome: string;
        nivel: 'Superior' | 'Médio' | 'Fundamental';
        vagas_amplas: number;
        vagas_pcd: number;
        vagas_cr: number;
        total_vagas: number;
        salario: string;
        carga_horaria: string;
        requisitos: string;
    }>;
    materias: Array<{
        nome: string;
        categoria: string; // Ex: Direito, Português, Exatas
        nivel_compativel: 'Superior' | 'Médio' | 'Fundamental';
    }>;
    cargos_materias: Array<{
        cargo_nome: string; // Para linkar com o cargo
        materia_nome: string; // Para linkar com a materia
    }>;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const parseEditalWithAI = async (text: string): Promise<ParsedConcurso> => {
    if (!API_KEY) {
        throw new Error('Chave da API Gemini não configurada. Verifique as variáveis de ambiente (VITE_GEMINI_API_KEY).');
    }

    const prompt = `
        Você é um especialista em análise de editais de concursos públicos.
        Analise o texto extraído de um edital abaixo e extraia as informações estruturadas em JSON.
        Seja preciso. Se não encontrar uma informação, deixe como string vazia ou 0.
        
        IMPORTANTE:
        1. Identifique o Concurso (Nome, Banca, Órgão).
        2. Liste TODOS os Cargos com suas vagas, salários e requisitos.
        3. Identifique as Matérias cobradas (Conhecimentos Básicos e Específicos). Tente agrupar nomes de matérias similares.
        4. No campo 'cargos_materias', associe quais matérias caem para quais cargos (pelo nome).
        
        O JSON deve seguir estritamente esta estrutura:
        {
            "concurso": {
                "nome": "Texto",
                "banca": "Texto",
                "orgao": "Texto",
                "salario_maximo": "Texto",
                "total_vagas": 0,
                "cidades": ["Texto"],
                "observacoes": "Texto curto resumo"
            },
            "cargos": [
                {
                    "nome": "Texto",
                    "nivel": "Superior" | "Médio" | "Fundamental",
                    "vagas_amplas": 0,
                    "vagas_pcd": 0,
                    "vagas_cr": 0,
                    "total_vagas": 0,
                    "salario": "Texto",
                    "carga_horaria": "Texto",
                    "requisitos": "Texto"
                }
            ],
            "materias": [
                {
                    "nome": "Nome da Matéria",
                    "categoria": "Direito" | "Linguagens" | "Exatas" | "Tecnologia" | "Outros",
                    "nivel_compativel": "Superior" | "Médio" | "Fundamental"
                }
            ],
            "cargos_materias": [
                {
                    "cargo_nome": "Nome exato do cargo acima",
                    "materia_nome": "Nome exato da matéria acima"
                }
            ]
        }

        Texto do Edital (truncado se necessário):
        ${text.slice(0, 100000)} 
    `;
    // Note: Gemini 1.5 Flash supports large context, but we slice just in case of massive files to avoid transport errors if not needed. 100k chars is usually enough for key parts of edital if text is well extracted.
    // For better results in production, we might want to be smarter about slicing (beginning + middle where tables usually are), but this is a good start.

    // List of models to try in order
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    let lastError: any;

    for (const model of models) {
        try {
            console.log(`Tentando modelo: ${model}...`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                // If 404, try next model. If 403/400, might be key issue.
                const status = response.status;
                if (status === 404) {
                    console.warn(`Modelo ${model} não encontrado (404). Tentando próximo.`);
                    lastError = `Modelo ${model} indisponível: ${errText}`;
                    continue;
                }
                throw new Error(`Erro na API Gemini (${model}): ${status} - ${errText}`);
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error(`Resposta inválida do Gemini (${model}): ${JSON.stringify(data)}`);
            }

            const jsonText = data.candidates[0].content.parts[0].text;
            return JSON.parse(jsonText);

        } catch (error) {
            console.error(`Falha no modelo ${model}:`, error);
            lastError = error;
            // Continue to next model if available
        }
    }

    throw lastError || new Error('Falha ao processar com todos os modelos de IA.');
};
