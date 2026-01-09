import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get Token from URL (Query Param) or Body
        const url = new URL(req.url)
        const queryToken = url.searchParams.get('token')

        const body = await req.json()

        // 2. Parse Fields based on Kiwify Real Payload (Nested or Flat)
        // Kiwify sometimes sends { order: { ... } } and sometimes just { ... } depending on version/test.

        let orderData = body;
        if (body.order) {
            orderData = body.order;
        }

        // Extract Customer info
        const customer = orderData.Customer || {};
        const email = customer.email || body.email || 'unknown'; // Fallback to body.email for simulator

        // Extract Event
        // Common keys: webhook_event_type (Kiwify), evento (Simulator), event_type (Generic)
        const rawEvent = orderData.webhook_event_type || body.evento || body.event_type || 'unknown_event';

        // Token: Usually query param, but check body too
        const bodyToken = body.token;
        const receivedToken = queryToken || bodyToken;

        // Log ATTEMPT immediately (Before Security Check)
        await supabaseClient.from('webhook_logs').insert({
            email: email,
            evento: rawEvent,
            plano_aplicado: 'pending_check',
            payload: body
        })

        // 3. Security Check
        if (receivedToken !== 'sy1usrcynbl') {
            return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Token' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 4. Determine New Plan
        const validProEvents = [
            'order_approved',
            'subscription_renewed',
            'assinatura_renovada',
            'compra_aprovada',
            'paid',
            'approved'
        ];

        const cancelEvents = [
            'order_refunded',
            'subscription_canceled',
            'subscription_late',
            'chargeback',
            'assinatura_cancelada',
            'status_changed', // Check status in payload if needed
            'canceled',
            'refunded'
        ];

        const isPro = validProEvents.some(e => rawEvent.toLowerCase().includes(e));
        const isCancel = cancelEvents.some(e => rawEvent.toLowerCase().includes(e));

        let newPlan = 'free';
        let shouldUpdate = false;

        if (isPro) {
            newPlan = 'pro';
            shouldUpdate = true;
        } else if (isCancel) {
            newPlan = 'free';
            shouldUpdate = true;
        }

        let userId = null;
        if (shouldUpdate && email !== 'unknown') {
            const { data: profiles } = await supabaseClient
                .from('profiles')
                .select('id')
                .eq('email', email)
                .limit(1)

            if (profiles && profiles.length > 0) {
                userId = profiles[0].id
                await supabaseClient.from('profiles').update({ plan: newPlan }).eq('id', userId)

                // Log Success
                await supabaseClient.from('webhook_logs').insert({
                    email,
                    evento: 'SYSTEM_UPDATE_PLAN',
                    plano_aplicado: newPlan,
                    payload: { original_event: rawEvent, status: 'updated' }
                })
            } else {
                console.log('User not found in profiles for email:', email);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Processed. Event: ${rawEvent}`,
                plan_applied: shouldUpdate ? newPlan : 'no_change',
                user_found: !!userId
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
