
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RankingEntry } from '../types';

export function useRanking() {
    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchRanking = async () => {
        setLoading(true);
        try {
            // Nova estratégia: Buscar PERFIS primeiro para garantir que quem tem cargo salvo apareça
            // Limitamos a 100 usuários para não pesar, mas idealmente seria paginado ou filtrado no back
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, name, city, state, profile_picture, my_cargos_ids')
                .limit(100);

            if (!profilesData || profilesData.length === 0) {
                setRanking([]);
                return;
            }

            // Busca progresso desses usuários
            const userIds = profilesData.map(p => p.id);
            const { data: progressData } = await supabase
                .from('user_progress')
                .select('user_id, questions_resolved, accuracy_rate')
                .in('user_id', userIds);

            const progressMap = new Map(progressData?.map(p => [p.user_id, p]) || []);

            // Gera ranking explodido por cargo
            const formattedRanking: RankingEntry[] = profilesData.flatMap(profile => {
                let cargosIds = profile.my_cargos_ids;

                // Validação e normalização de my_cargos_ids
                if (!cargosIds) {
                    return [];
                }

                // Se vier como string (JSON), tenta parsear
                if (typeof cargosIds === 'string') {
                    try {
                        cargosIds = JSON.parse(cargosIds);
                    } catch (e) {
                        // Se falhar o parse, tenta usar como ID único se não parecer JSON, ou ignora
                        // Mas assumindo que deve ser array...
                        return [];
                    }
                }

                if (!Array.isArray(cargosIds) || cargosIds.length === 0) {
                    return [];
                }

                const progress = progressMap.get(profile.id);
                // Dados de progresso default se não tiver (ex: usuário novo que salvou cargo mas não fez questão)
                const stats = progress || { questions_resolved: 0, accuracy_rate: 0 };

                return cargosIds.map((cargoId: string) => ({
                    id: `${profile.id}-${cargoId}`,
                    userName: profile.name || 'Usuário Anônimo',
                    city: profile.city || '',
                    state: profile.state || '',
                    accuracyRate: Number(stats.accuracy_rate),
                    questionsResolved: stats.questions_resolved,
                    cargoId: cargoId,
                    avatar: profile.profile_picture || ''
                }));
            });

            // Ordena por acerto
            setRanking(formattedRanking.sort((a, b) => b.accuracyRate - a.accuracyRate));

        } catch (err) {
            console.error('Erro ao buscar ranking', err);
            // Poderíamos setar um erro no state para exibir na UI
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanking();
        // Atualiza periodicamente
        const interval = setInterval(fetchRanking, 30000);
        return () => clearInterval(interval);
    }, []);

    return { ranking, loading, refreshRanking: fetchRanking };
}
