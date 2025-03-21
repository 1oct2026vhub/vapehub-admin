import { redirect } from "next/navigation";

function MainPage() {
  // redirect(`/example`);
  redirect(`/dashboards/project`);
  return null;
}

export default MainPage;
