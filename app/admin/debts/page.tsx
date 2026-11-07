import { redirect } from "next/navigation";
import { getMyPermissions, requireAnyPermission } from "../../../lib/admin/access";

export default async function Page() {
  await requireAnyPermission(["store_debts", "personal_debts", "installments"]);
  const perms = await getMyPermissions();
  if (perms.includes("personal_debts")) redirect("/admin/debts/personal");
  if (perms.includes("store_debts")) redirect("/admin/debts/store");
  if (perms.includes("installments")) redirect("/admin/debts/installments");
  redirect("/admin/debts/personal");
}
