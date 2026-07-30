import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    // Excluir login, api, assets, favicon y archivos en / (logos, etc.)
    "/((?!login|api/auth|api/nps|api/public|_next/static|_next/image|favicon.ico|Logo_|next\\.svg|vercel\\.svg|file\\.svg|globe\\.svg|window\\.svg).*)",
  ],
};
