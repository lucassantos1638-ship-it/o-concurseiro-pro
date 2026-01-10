import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Concurso, Cargo, Materia, Questao, Nivel, StatusConcurso, CargoMateriaConfig } from '../types';

export function useCoreData() {
    const [concursos, setConcursos] = useState<Concurso[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [questoes, setQuestoes] = useState<Questao[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Concursos
            const { data: concursosData } = await supabase.from('concursos').select('*');
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
                    editalPdf: c.link_edital
                },
                observacoes: c.observacoes,
                imageUrl: c.image_url,
                subCoverUrl: c.sub_cover_url,
                totalVagas: c.total_vagas,
                salarioMaximo: c.salario_maximo
            }));

            // 2. Fetch Materias
            const { data: materiasData } = await supabase.from('materias').select('*');
            const mappedMaterias: Materia[] = (materiasData || []).map(m => ({
                id: m.id,
                nome: m.nome,
                categoria: m.categoria,
                descricao: m.descricao,
                nivelCompativel: m.nivel_compativel as Nivel
            }));

            // 3. Fetch Cargos & Relations (CargosMaterias)
            const { data: cargosData } = await supabase.from('cargos').select('*');
            const { data: cargosMateriasData } = await supabase.from('cargos_materias').select('*');

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
                    vagasCR: c.vagas_cr,
                    totalVagas: c.total_vagas,
                    salario: c.salario,
                    cargaHoraria: c.carga_horaria,
                    requisitos: c.requisitos,
                    materiasConfig: configs
                };
            });

            // 4. Fetch Questoes
            const { data: questoesData } = await supabase.from('questoes').select('*');
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

        } catch (error) {
            console.error('Error fetching core data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { concursos, cargos, materias, questoes, loading, refreshData: fetchData };
}
