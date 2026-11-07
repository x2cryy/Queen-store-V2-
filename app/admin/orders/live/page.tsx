import Link from "next/link";
import { requireAnyPermission } from "../../../../lib/admin/access";
import { createClient } from "../../../../lib/supabase/server";
import { PAYMENT_STATUS_LABEL, statusLabel } from "../../../../lib/shop/orders";
import { PageHead } from "../../_components/ui";
import { LiveBoard, type LiveOrder } from "../_components/LiveBoard";

export const dynamic = "force-dynamic";

export default async function LiveOrdersPage() {
  await requireAnyPermission(["orders"]);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_number,customer_name,phone,total,status,payment_status,created_at,governorate")
    .in("status", ["new", "preparing", "ready"])
    .order("created_at", { ascending: false })
    .limit(80);

  const orders = ((data ?? []) as unknown as Omit<LiveOrder, "status_label" | "pay_label">[]).map((o) => ({
    ...o,
    status_label: statusLabel(o.status),
    pay_label: PAYMENT_STATUS_LABEL[o.payment_status] ?? o.payment_status,
  }));

  return (
    <section>
      <PageHead
        title="الطلبات المباشرة"
        desc="الطلبات الجديدة وقيد التجهيز والجاهزة. تظهر الطلبات الجديدة هنا تلقائياً."
        actions={
          <>
            <Link className="ds-btn" href="/admin/orders/manage">إدارة الطلبات</Link>
            <Link className="ds-btn" href="/admin/orders">رجوع</Link>
          </>
        }
      />
      {error ? (
        <p role="alert" style={{ color: "var(--c-bad, #B91C1C)", fontWeight: 600 }}>تعذر تحميل الطلبات.</p>
      ) : (
        <LiveBoard orders={orders} />
      )}
    </section>
  );
}
