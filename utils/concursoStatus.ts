import { Concurso } from '../types';

export const getConcursoStatus = (concurso: Concurso): string => {
    const now = new Date();
    // Set to midnight to compare dates only
    now.setHours(0, 0, 0, 0);

    const { inscricaoInicio, inscricaoFim, prova } = concurso.datas;

    if (!inscricaoInicio) return concurso.status;

    // Improve parsing: check if T exists (ISO) or Date Object?
    // Supabase usually returns YYYY-MM-DD for date columns.
    const parseDate = (dateStr?: string) => {
        if (!dateStr) return null;
        // Check if looks like ISO
        if (dateStr.includes('T')) {
            const d = new Date(dateStr);
            d.setHours(0, 0, 0, 0);
            return isNaN(d.getTime()) ? null : d;
        }
        // Assume YYYY-MM-DD
        const d = new Date(dateStr + 'T12:00:00');
        d.setHours(0, 0, 0, 0);
        return isNaN(d.getTime()) ? null : d;
    };

    const start = parseDate(inscricaoInicio);
    const end = parseDate(inscricaoFim);
    const exam = parseDate(prova);

    // If start date is invalid, prevent falling back to DB status if possible, 
    // OR just return DB status but log/warn (internal).
    if (!start) return concurso.status;

    // 1. Antes do início das inscrições -> "Edital Publicado"
    if (now < start) {
        return 'Edital Publicado';
    }

    // 2. Entre início e fim (inclusive) -> "Inscrições Abertas"
    if (end && now <= end) {
        return 'Inscrições Abertas';
    }

    // 3. Após fim inscrições e antes da prova (ou se prova for hoje?) -> "Em Andamento"
    // Usually "Em Andamento" means subscriptions closed, waiting for exam.
    if (exam && now < exam) {
        return 'Em Andamento';
    }

    // 4. Após (ou na) data da prova -> "Provas Realizadas"
    if (exam && now >= exam) {
        return 'Provas Realizadas';
    }

    // Fallback if past subscriptions but no exam date?
    if (!exam && end && now > end) {
        return 'Em Andamento';
    }

    return 'Inscrições Abertas';
};
