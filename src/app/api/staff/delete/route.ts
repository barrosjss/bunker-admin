import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
  try {
    // 1. Verificar que el solicitante es owner o admin
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

    // 2. Obtener el ID del registro a eliminar
    const { staffId } = await request.json();
    if (!staffId) {
      return NextResponse.json({ error: "staffId requerido" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 3. Verificar que el registro pertenece al mismo establecimiento
    const { data: target } = await adminSupabase
      .from("establishment_users")
      .select("id, user_id, establishment_id, role")
      .eq("id", staffId)
      .single();

    if (!target) {
      return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
    }

    if (target.establishment_id !== caller.establishment_id) {
      return NextResponse.json({ error: "Sin permisos para este establecimiento" }, { status: 403 });
    }

    // No permitir eliminar el propio registro
    if (target.user_id === user.id) {
      return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 });
    }

    // 4. Eliminar el registro de establishment_users
    const { error: deleteError } = await adminSupabase
      .from("establishment_users")
      .delete()
      .eq("id", staffId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // 5. Opcional: eliminar el usuario de Auth si ya no tiene otros establecimientos
    if (target.user_id) {
      const { count } = await adminSupabase
        .from("establishment_users")
        .select("id", { count: "exact", head: true })
        .eq("user_id", target.user_id);

      // Solo eliminar de Auth si no tiene registros en otros establecimientos
      if (count === 0) {
        await adminSupabase.auth.admin.deleteUser(target.user_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
