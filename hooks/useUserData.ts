
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserProgress } from '../types';
import { INITIAL_STATE } from '../constants';
import { Session } from '@supabase/supabase-js';

export function useUserData(session: Session | null) {
    // Inicializa com valores vazios para não "piscar" dados antigos
    const [profile, setProfile] = useState<UserProfile>({
        name: '',
        state: '',
        city: '',
        profilePicture: '',
        plan: 'free'
    });

    const [progress, setProgress] = useState<UserProgress>({
        hoursStudied: 0,
        questionsResolved: 0,
        accuracyRate: 0,
        history: []
    });

    const [myCargosIds, setMyCargosIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!session?.user) {
            // Se não tem sessão, limpa os dados
            setProfile({
                name: '',
                state: '',
                city: '',
                profilePicture: '',
                plan: 'free'
            });
            setProgress({
                hoursStudied: 0,
                questionsResolved: 0,
                accuracyRate: 0,
                history: []
            });
            setMyCargosIds([]);
            return;
        }

        const fetchUserData = async () => {
            setLoading(true);
            const user = session.user;

            try {
                // 1. Fetch ou Create Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError && profileError.code === 'PGRST116') {
                    // Profile não existe, criar padrão
                    const defaultProfile = {
                        id: user.id,
                        name: user.user_metadata?.full_name || 'Novo Usuário',
                        city: 'Não informado',
                        state: 'Não informado',
                        profile_picture: '',
                        my_cargos_ids: [],
                        plan: 'free'
                    };

                    const { error: insertError } = await supabase.from('profiles').insert(defaultProfile);
                    if (!insertError) {
                        setProfile({
                            name: defaultProfile.name,
                            city: defaultProfile.city,
                            state: defaultProfile.state,
                            profilePicture: defaultProfile.profile_picture,
                            plan: 'free'
                        });
                        setMyCargosIds([]);
                    }
                } else if (profileData) {
                    setProfile({
                        name: profileData.name,
                        city: profileData.city || '',
                        state: profileData.state || '',
                        profilePicture: profileData.profile_picture || '',
                        plan: (profileData.plan as 'free' | 'pro') || 'free'
                    });
                    setMyCargosIds(profileData.my_cargos_ids || []);
                }

                // 2. Fetch ou Create Progress
                const { data: progressData, error: progressError } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (progressError && progressError.code === 'PGRST116') {
                    const defaultProgress = {
                        user_id: user.id,
                        hours_studied: 0,
                        questions_resolved: 0,
                        accuracy_rate: 0,
                        history: []
                    };
                    await supabase.from('user_progress').insert(defaultProgress);
                    // Mantém state inicial zerado
                } else if (progressData) {
                    setProgress({
                        hoursStudied: Number(progressData.hours_studied),
                        questionsResolved: progressData.questions_resolved,
                        accuracyRate: Number(progressData.accuracy_rate),
                        history: progressData.history || []
                    });
                }

            } catch (error) {
                console.error('Erro ao carregar dados do usuário:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();

        // 3. Subscribe to Realtime Updates (e.g. Plan changes via Webhook)
        const channel = supabase
            .channel(`profile-updates-${session.user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${session.user.id}`
                },
                (payload) => {
                    const newData = payload.new;
                    if (newData) {
                        setProfile(prev => ({
                            ...prev,
                            // Update fields that might change remotely. 
                            // Usually just 'plan', but we can sync others.
                            plan: (newData.plan as 'free' | 'pro') || 'free',
                            // Preserve local optimistic updates if needed, or sync all:
                            name: newData.name,
                            city: newData.city,
                            state: newData.state,
                            profilePicture: newData.profile_picture
                        }));
                        setMyCargosIds(newData.my_cargos_ids || []);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session]);

    const updateProfile = async (newProfile: UserProfile) => {
        if (!session?.user) return;
        setProfile(newProfile); // Update local

        await supabase.from('profiles').update({
            name: newProfile.name,
            city: newProfile.city,
            state: newProfile.state,
            profile_picture: newProfile.profilePicture
        }).eq('id', session.user.id);
    };

    const updateMyCargos = async (ids: string[]) => {
        if (!session?.user) return;
        setMyCargosIds(ids);
        await supabase.from('profiles').update({ my_cargos_ids: ids }).eq('id', session.user.id);
    };

    const updateProgress = async (newProgress: Partial<UserProgress>) => {
        if (!session?.user) return;

        const merged = { ...progress, ...newProgress };
        setProgress(merged);

        await supabase.from('user_progress').update({
            hours_studied: merged.hoursStudied,
            questions_resolved: merged.questionsResolved,
            accuracy_rate: merged.accuracyRate,
            history: merged.history
        }).eq('user_id', session.user.id);
    };

    return {
        profile,
        progress,
        myCargosIds,
        loading,
        updateProfile,
        updateMyCargos,
        updateProgress
    };
}
