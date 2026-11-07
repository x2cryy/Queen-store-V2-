import { requireAnyPermission } from "../../../../lib/admin/access";
import { createClient } from "../../../../lib/supabase/server";
import { PageHead, Panel } from "../../_components/ui";
import { ProductForm } from "../_components/ProductForm";

export default async function Page() {
  await requireAnyPermission(["products"]);
  const sb = await createClient();
  const { data } = await sb.from("categories").select("id,name").order("sort_order");
  return (
    <section>
      <PageHead title="إضافة منتج" desc="أدخل بيانات المنتج. الصور والمتغيرات تُضاف في خطوة لاحقة." />
      <Panel><ProductForm categories={data ?? []} /></Panel>
    </section>
  );
}
