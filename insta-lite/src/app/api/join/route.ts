import { supabase } from '@/lib/supabase';

export async function PATCH(req: Request) {
  const { activity_id } = await req.json();

  // Fetch current joined count and max_people
  const { data: activity, error } = await supabase
    .from('activities')
    .select('joined,max_people')
    .eq('id', activity_id)
    .single();

  if (error || !activity) return new Response(JSON.stringify({ error: error?.message || "Activity not found" }), { status: 404 });

  if (activity.max_people && activity.joined >= activity.max_people) {
    return new Response(JSON.stringify({ error: "Activity full" }), { status: 400 });
  }

  // Increment joined
  const { data, error: updateError } = await supabase
    .from('activities')
    .update({ joined: activity.joined + 1 })
    .eq('id', activity_id);

  if (updateError) return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  return new Response(JSON.stringify(data), { status: 200 });
}
