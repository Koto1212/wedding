import Link from "next/link";
import { FallbackPage } from "@/components/FallbackPage";

export default function NotFound() {
  return (
    <FallbackPage
      en={{
        title: "Page not found",
        body: "This link doesn't lead anywhere. The invitation is just a click away.",
      }}
      ar={{
        title: "الصفحة غير موجودة",
        body: "هذا الرابط لا يؤدي إلى أي صفحة. الدعوة على بُعد نقرة واحدة.",
      }}
    >
      <Link href="/" className="btn-primary bg-gold text-forest-deep hover:bg-gold-soft">
        Invitation
      </Link>
      <Link href="/ar" className="btn-ghost">
        الدعوة
      </Link>
    </FallbackPage>
  );
}
