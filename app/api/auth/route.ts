import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_ID = "admin";
const ADMIN_PW = "$init0000!";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (username === ADMIN_ID && password === ADMIN_PW) {
    const cookieStore = await cookies();
    cookieStore.set("admin_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 4,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json(
    { success: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." },
    { status: 401 }
  );
}

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth");
  const isAuth = authCookie?.value === "authenticated";
  return NextResponse.json({ authenticated: isAuth });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("admin_auth", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ success: true });
}
