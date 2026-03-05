import { useSearchParams, Navigate } from "react-router";
import { CardCollectionStep } from "@/components/card-collection-step";

export const CardSetupPage = () => {
  const [searchParams] = useSearchParams();

  const userId = searchParams.get("user_id");
  const userEmail = searchParams.get("email");
  const userName = searchParams.get("name");

  // If missing required params, redirect to signup
  if (!userId || !userEmail || !userName) {
    return <Navigate to="/signup" replace />;
  }

  return <CardCollectionStep userId={userId} userEmail={userEmail} userName={userName} />;
};
