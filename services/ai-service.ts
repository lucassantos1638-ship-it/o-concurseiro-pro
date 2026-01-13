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
        throw new Error('Chave da API Gemini não configurada.');
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

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
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
            const err = await response.text();
            throw new Error(`Erro na API Gemini: ${err}`);
        }

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;

        return JSON.parse(jsonText);
    } catch (error) {
        console.error('Erro ao consultar Gemini:', error);
        throw error;
    }
};
