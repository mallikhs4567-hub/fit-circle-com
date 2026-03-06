import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find expired or deleted posts that have media
    const { data: expiredPosts, error: queryError } = await supabase
      .from('posts')
      .select('id, image_url')
      .not('image_url', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (queryError) throw queryError;

    let cleaned = 0;

    for (const post of expiredPosts || []) {
      if (!post.image_url) continue;

      // Extract file path from URL
      const urlParts = post.image_url.split('/post-media/');
      if (urlParts.length < 2) continue;
      const filePath = urlParts[1];

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from('post-media')
        .remove([filePath]);

      if (!deleteError) {
        cleaned++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, cleaned }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
