
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Starting subject fix...');

    // 1. Fetch all cargos_materias
    const { data: links, error } = await supabase
        .from('cargos_materias')
        .select('id, cargo_id, materia_id');

    if (error) {
        console.error('Error fetching links:', error);
        return;
    }

    console.log(`Found ${links.length} total links.`);

    // 2. Fetch all cargos and materias to look up details locally (better than thousands of single fetches)
    const { data: cargos } = await supabase.from('cargos').select('id, nome');
    const { data: materias } = await supabase.from('materias').select('id, nome, categoria, nivel_compativel');

    const cargoMap = new Map(cargos?.map(c => [c.id, c]));
    const materiaMap = new Map(materias?.map(m => [m.id, m]));

    for (const link of links) {
        const materia = materiaMap.get(link.materia_id);
        const cargo = cargoMap.get(link.cargo_id);

        if (!materia || !cargo) continue;

        const matName = materia.nome.trim();
        // Check if starts with "Conhecimento" (case insensitive)
        if (matName.match(/^Conhecimento/i) && !matName.includes(cargo.nome)) {
            console.log(`Processing: ${matName} for Cargo: ${cargo.nome}`);

            const newName = `${matName} (${cargo.nome})`;

            // Check if this specific subject already exists (locally or DB)
            // Let's check DB to be safe and authoritative
            const { data: existing } = await supabase
                .from('materias')
                .select('id')
                .eq('nome', newName)
                .eq('nivel_compativel', materia.nivel_compativel)
                .maybeSingle();

            let targetMateriaId;

            if (existing) {
                console.log(`  -> Subject already exists: ${newName} (${existing.id}). Re-linking...`);
                targetMateriaId = existing.id;
            } else {
                console.log(`  -> Creating new subject: ${newName}`);

                // UUID generation if needed, or let DB handle it? 'id' is text in this schema, likely user-generated or random.
                // admin code uses Math.random... let's use the same or crypto
                const newId = Math.random().toString(36).substr(2, 9);

                const { data: newMat, error: createError } = await supabase
                    .from('materias')
                    .insert({
                        id: newId,
                        nome: newName,
                        categoria: materia.categoria,
                        nivel_compativel: materia.nivel_compativel
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('  -> Error creating subject:', createError);
                    continue;
                }
                targetMateriaId = newMat.id;
            }

            // Update the link to point to the new (or existing specific) materia
            const { error: updateError } = await supabase
                .from('cargos_materias')
                .update({ materia_id: targetMateriaId })
                .eq('id', link.id);

            if (updateError) {
                console.error('  -> Error updating link:', updateError);
            } else {
                console.log('  -> Link updated successfully.');
            }
        }
    }

    console.log('Done.');
}

run();
