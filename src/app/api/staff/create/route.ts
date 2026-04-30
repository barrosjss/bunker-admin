import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar que el solicitante está autenticado y es owner/admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: caller } = await supabase
      .from("establishment_users")
      .select("role, establishment_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!caller || !["owner", "admin"].includes(caller.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    // 2. Leer y validar el body
    const body = await request.json();
    const { name, email, password, role, member_id, is_active } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "name, email, password y role son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // 3. Crear el usuario en Supabase Auth con el service role
    const adminSupabase = createAdminClient();

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // confirmar email automáticamente (sin necesidad de verificar)
      user_metadata: { name },
    });

    if (authError) {
      // Si el usuario ya existe en Auth, solo crear el registro de establishment_users
      if (authError.message.includes("already been registered") || authError.code === "email_exists") {
        // Buscar el user existente
        const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users.find((u) => u.email === email);

        if (!existingUser) {
          return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // Insertar en establishment_users con el user_id existente
        const { error: insertError } = await adminSupabase
          .from("establishment_users")
          .insert({
            establishment_id: caller.establishment_id,
            user_id: existingUser.id,
            name,
            email,
            role,
            member_id: member_id || null,
            is_active: is_active ?? true,
          });

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, user_id: existingUser.id });
      }

      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = authData.user.id;

    // 4. Crear el registro en establishment_users vinculado al nuevo user
    const { error: euError } = await adminSupabase
      .from("establishment_users")
      .insert({
        establishment_id: caller.establishment_id,
        user_id: newUserId,
        name,
        email,
        role,
        member_id: member_id || null,
        is_active: is_active ?? true,
      });

    if (euError) {
      // Si falla el insert, eliminar el usuario de auth para no dejar huérfanos
      await adminSupabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: euError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user_id: newUserId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
