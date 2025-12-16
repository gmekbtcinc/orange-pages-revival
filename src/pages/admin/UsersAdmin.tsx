import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function UsersAdmin() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Users
          </h1>
          <p className="text-muted-foreground">Manage platform users</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              User management features are under development. You'll be able to view all company users, roles, and permissions here.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
