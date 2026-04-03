import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Create admin user
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: "admin123@gmail.com",
    password: "admin2005",
    email_confirm: true,
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), { status: 400 });
  }

  // Assign admin role
  const { error: roleError } = await supabase.from("user_roles").insert({
    user_id: userData.user.id,
    role: "admin",
  });

  if (roleError) {
    return new Response(JSON.stringify({ error: roleError.message }), { status: 400 });
  }

  // Create profile
  await supabase.from("profiles").insert({
    user_id: userData.user.id,
    email: "admin123@gmail.com",
    display_name: "Admin",
  });

  return new Response(JSON.stringify({ success: true, user_id: userData.user.id }));
});
