import { useForm } from "@refinedev/react-hook-form";
import { useNavigate } from "react-router";
import { EditView } from "@/components/refine-ui/views/edit-view";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function PlanEditPage() {
  const navigate = useNavigate();
  const [features, setFeatures] = useState<string[]>([""]);

  const {
    refineCore: { onFinish, query },
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    refineCoreProps: {
      resource: "tiers",
      action: "edit",
      redirect: "list",
    },
  });

  const billingCycle = watch("billing_cycle") || "monthly";
  const isActive = watch("is_active") ?? true;

  // Populate features from the fetched data
  useEffect(() => {
    if (query?.data?.data) {
      const plan = query.data.data;
      if (plan.features && Array.isArray(plan.features) && plan.features.length > 0) {
        setFeatures(plan.features);
      }
    }
  }, [query?.data?.data]);

  const onSubmit = (data: any) => {
    const cleanedFeatures = features.filter((f) => f.trim() !== "");
    onFinish({
      ...data,
      features: cleanedFeatures,
      price: parseFloat(data.price),
    });
  };

  const addFeature = () => {
    setFeatures([...features, ""]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  return (
    <EditView>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Plan Name *</Label>
            <Input id="name" {...register("name", { required: "Plan name is required" })} placeholder="e.g., Starter" />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message as string}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register("price", { required: "Price is required" })}
                placeholder="0.00"
              />
              {errors.price && <p className="text-sm text-red-500">{errors.price.message as string}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" {...register("currency")} placeholder="ZAR" defaultValue="ZAR" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="billing_cycle">Billing Cycle *</Label>
            <Select value={billingCycle} onValueChange={(value) => setValue("billing_cycle", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select billing cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Features</Label>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Enter feature description"
                  />
                  {features.length > 1 && (
                    <Button type="button" variant="outline" size="icon" onClick={() => removeFeature(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addFeature} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="is_active" checked={isActive} onCheckedChange={(checked) => setValue("is_active", checked)} />
            <Label htmlFor="is_active">Active Plan</Label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit">Save Changes</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/tiers")}>
            Cancel
          </Button>
        </div>
      </form>
    </EditView>
  );
}
