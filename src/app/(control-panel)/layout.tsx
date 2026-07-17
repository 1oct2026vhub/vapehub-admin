import MainLayout from "src/components/MainLayout";
import AuthGuardRedirect from "@auth/AuthGuardRedirect";
import { BulkStatusJobProvider } from "@/contexts/BulkStatusJobContext";

function Layout({ children }) {
  return (
    <AuthGuardRedirect>
      <BulkStatusJobProvider>
        <MainLayout>{children}</MainLayout>
      </BulkStatusJobProvider>
    </AuthGuardRedirect>
  );
}

export default Layout;
