import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Route classification
  const isAuthPage = pathname.startsWith("/login");
  const isApiRoute = pathname.startsWith("/api");
  const isAdminRoute = pathname.startsWith("/admin");
  const isTrainerRoute = pathname.startsWith("/trainer");
  const isPanelSelector = pathname === "/";

  // Skip middleware for API routes and static files
  if (isApiRoute) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login (except if already on login)
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login page to panel selector
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // For authenticated users on admin/trainer routes, verify they have a staff record
  if (user && (isAdminRoute || isTrainerRoute)) {
    const { data: staff } = await supabase
      .from("staff")
      .select("role")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .single();

    // No staff record - redirect to panel selector (will show error there)
    if (!staff) {
      if (!isPanelSelector) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // For admin routes, verify admin role
    if (isAdminRoute && staff.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/trainer";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
