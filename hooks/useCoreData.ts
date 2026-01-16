import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Concurso, Cargo, Materia, Questao, Nivel, StatusConcurso, CargoMateriaConfig } from '../types';

export function useCoreData() {
    const [concursos, setConcursos] = useState<Concurso[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [questoes, setQuestoes] = useState<Questao[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Execute all fetches in parallel
            const [
                { data: concursosData, error: concursosError },
                { data: materiasData, error: materiasError },
                { data: cargosData, error: cargosError },
                { data: cargosMateriasData, error: cargosMateriasError },
                { data: questoesData, error: questoesError }
            ] = await Promise.all([
                supabase.from('concursos').select('*'),
                supabase.from('materias').select('*'),
                supabase.from('cargos').select('*'),
                supabase.from('cargos_materias').select('*'),
                supabase.from('questoes').select('*')
            ]);

            // Check for critical errors (optional: could throw if any critical fail)
            if (concursosError) throw concursosError;
            if (materiasError) throw materiasError;
            if (cargosError) throw cargosError;

            // 1. Map Concursos
            const mappedConcursos: Concurso[] = (concursosData || []).map(c => ({
                id: c.id,
                nome: c.nome,
                banca: c.banca,
                orgao: c.orgao,
                status: c.status as StatusConcurso,
                cidades: c.cidades || [],
                datas: {
                    edital: c.data_edital,
                    prova: c.data_prova,
                    inscricaoInicio: c.data_inscricao_inicio,
                    inscricaoFim: c.data_inscricao_fim,
                },
                links: {
                    oficial: c.link_oficial,
                    inscricoes: c.link_inscricoes,
                    editalPdf: c.link_edital,
                    apostilas: c.link_apostilas,
                    cursos: c.link_cursos
                },
                observacoes: c.observacoes,
                imageUrl: c.image_url,
                subCoverUrl: c.sub_cover_url,
                totalVagas: c.total_vagas,
                salarioMaximo: c.salario_maximo
            }));

            // 2. Map Materias
            const mappedMaterias: Materia[] = (materiasData || []).map(m => ({
                id: m.id,
                nome: m.nome,
                categoria: m.categoria,
                descricao: m.descricao,
                nivelCompativel: m.nivel_compativel as Nivel
            }));

            // 3. Map Cargos
            const mappedCargos: Cargo[] = (cargosData || []).map(c => {
                const configs = (cargosMateriasData || [])
                    .filter((cm: any) => cm.cargo_id === c.id)
                    .map((cm: any) => ({
                        materiaId: cm.materia_id,
                        peso: cm.peso,
                        quantidadeQuestoes: cm.quantidade_questoes
                    }));

                return {
                    id: c.id,
                    concursoId: c.concurso_id,
                    nome: c.nome,
                    nivel: c.nivel as Nivel,
                    vagasAmplas: c.vagas_amplas,
                    vagasPcd: c.vagas_pcd,
                    vagasPn: c.vagas_pn,
                    vagasCR: c.vagas_cr,
                    totalVagas: c.total_vagas,
                    salario: c.salario,
                    cargaHoraria: c.carga_horaria,
                    requisitos: c.requisitos,
                    materiasConfig: configs
                };
            });

            // 4. Map Questoes
            const mappedQuestoes: Questao[] = (questoesData || []).map(q => ({
                id: q.id,
                codigo: q.codigo,
                banca: q.banca,
                ano: q.ano,
                prova: q.prova,
                enunciado: q.enunciado,
                textoAssociado: q.texto_associado,
                alternativas: q.alternativas || [],
                gabarito: q.gabarito,
                nivel: q.nivel as Nivel,
                materiaId: q.materia_id,
                estatisticaAcerto: q.estatistica_acerto,
                imagem: q.imagem
            }));

            setConcursos(mappedConcursos);
            setMaterias(mappedMaterias);
            setCargos(mappedCargos);
            setQuestoes(mappedQuestoes);

        } catch (error: any) {
            console.error('Error fetching core data:', error);
            setError(error.message || 'Erro ao carregar dados essenciais');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { concursos, cargos, materias, questoes, loading, error, refreshData: fetchData };
}
