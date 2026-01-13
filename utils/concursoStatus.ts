import { Concurso } from '../types';

export const getConcursoStatus = (concurso: Concurso): string => {
    const now = new Date();
    // Set to midnight to compare dates only
    now.setHours(0, 0, 0, 0);

    const { inscricaoInicio, inscricaoFim, prova } = concurso.datas;

    if (!inscricaoInicio) return concurso.status;

    // Append T12:00:00 to avoid timezone issues with YYYY-MM-DD strings causing day shift
    // Assuming inputs are YYYY-MM-DD
    const parseDate = (dateStr?: string) => {
        if (!dateStr) return null;
        const d = new Date(dateStr + 'T12:00:00');
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const start = parseDate(inscricaoInicio);
    const end = parseDate(inscricaoFim);
    const exam = parseDate(prova);

    if (!start) return concurso.status;

    // 1. Antes do início das inscrições -> "Edital Aberto"
    if (now < start) {
        return 'Edital Aberto';
    }

    // 2. Entre início e fim (inclusive) -> "Inscrições Abertas"
    // Note: If no end date, assume open indefinitely? Or fallback? Assuming having end date.
    if (end && now <= end) {
        return 'Inscrições Abertas';
    }

    // If here, we are past the end date (or no end date provided, but usually required)
    // 3. Após fim inscrições e antes da prova -> "Em Andamento"
    if (exam && now < exam) {
        return 'Em Andamento';
    }

    // 4. Após (ou na) data da prova -> "Provas Realizadas"
    if (exam && now >= exam) {
        return 'Provas Realizadas';
    }

    // Fallback if past subscriptions but no exam date? "Em Andamento" seems safe.
    if (!exam && end && now > end) {
        return 'Em Andamento';
    }

    return 'Inscrições Abertas'; // Default fallback if started and no end date?
};
