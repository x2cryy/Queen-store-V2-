import "./home-preview.css";
import { requireAnyPermission } from "../../../lib/admin/access";
import HomeClient from "./_components/HomeClient";
import { todayISO } from "./_lib/utils";

export default async function Page() {
  await requireAnyPermission(["dashboard"]);
  return <HomeClient today={todayISO()} />;
}
