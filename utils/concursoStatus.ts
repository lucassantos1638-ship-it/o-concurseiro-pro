import { Concurso } from '../types';

export const getConcursoStatus = (concurso: Concurso): string => {
    const now = new Date();
    // Set to midnight to compare dates only
    now.setHours(0, 0, 0, 0);

    const { inscricaoInicio, inscricaoFim, prova, edital } = concurso.datas;

    const parseDate = (dateStr?: string) => {
        if (!dateStr) return null;

        let d: Date;
        // Improve parsing logic to handle ISO and DD/MM/YYYY
        if (dateStr.includes('T')) {
            d = new Date(dateStr);
        } else if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                // dd/mm/yyyy -> yyyy-mm-dd
                d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
            } else {
                return null;
            }
        } else {
            // Assume YYYY-MM-DD
            d = new Date(dateStr + 'T12:00:00');
        }

        if (isNaN(d.getTime())) return null;

        d.setHours(0, 0, 0, 0);
        return d;
    };

    const start = parseDate(inscricaoInicio);
    const end = parseDate(inscricaoFim);
    const exam = parseDate(prova);
    const editalDate = parseDate(edital);

    // 1. Pós prova -> "Provas Realizadas"
    // "depois que passar o dia da prova" (now estritamente maior que data da prova)
    if (exam && now > exam) {
        return 'Provas Realizadas';
    }

    // 2. Terminou inscrições (e ainda não passou prova) -> "Em Andamento"
    // "depois em andamento quando finalizar as inscrições"
    if (end && now > end) {
        return 'Em Andamento';
    }

    // 3. Dentro do período de inscrições -> "Inscrições Abertas"
    // "depois inscrições abertas quando chegar na data das inscrições"
    if (start && now >= start) {
        return 'Inscrições Abertas';
    }

    // 4. Edital saiu (antes das inscrições) -> "Edital Publicado"
    // "puxar pela data cadastrada no cadastro do concurso, edital aberto"
    // Se temos data de início e hoje é antes, então Edital já foi publicado.
    if (start && now < start) {
        return 'Edital Publicado';
    }

    // Se tiver data de edital explícita e já passou
    if (editalDate && now >= editalDate) {
        return 'Edital Publicado';
    }

    // Fallback para datas futuras ainda não alcançadas
    if (editalDate || start || end || exam) {
        return 'Previsto';
    }

    // Se não tiver datas, usa o status manual do banco
    return concurso.status;
};
