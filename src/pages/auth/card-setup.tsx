import { Navigate } from "react-router";
import { CardCollectionStep } from "@/components/card-collection-step";
import { useAuth } from "@/contexts/auth-context";
import { getSelectedPlanCheckout } from "@/lib/plan-selection";

export const CardSetupPage = () => {
  const { user, loading } = useAuth();
  const selectedPlan = getSelectedPlanCheckout();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">Preparing checkout</h1>
          <p className="text-sm text-muted-foreground">We are loading your selected plan.</p>
        </div>
      </div>
    );
  }

  if (!user || !selectedPlan) {
    return <Navigate to="/plans" replace />;
  }

  return (
    <CardCollectionStep
      userId={user.id}
      userEmail={user.email || ""}
      userName={user.name}
      plan={{
        ...selectedPlan,
        features: selectedPlan.features || [],
        is_active: true,
        created_at: "",
        updated_at: "",
      }}
    />
  );
};
