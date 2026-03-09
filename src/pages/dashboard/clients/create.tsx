import React from "react";
import { type HttpError, useBack } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreateView } from "@/components/refine-ui/views/create-view";
import { usePlanEntitlements } from "@/hooks/use-plan-entitlements";
import type { Client } from "@/types";

const clientFormSchema = z.object({
  name: z.string().min(1, { message: "Full name is required" }),
  email: z.string().min(1, { message: "Email is required" }).email({ message: "Invalid email address" }),
  company: z.string().optional(),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export const ClientCreatePage: React.FC = () => {
  const back = useBack();
  const { entitlements, usage, canCreateClient } = usePlanEntitlements();

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<Client, HttpError, ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    },
    refineCoreProps: {
      resource: "clients",
      action: "create",
      redirect: "list",
    },
  });

  function onSubmit(values: ClientFormValues) {
    const addressParts = [values.street, values.city, values.state, values.zip, values.country]
      .filter(Boolean)
      .join(", ");

    onFinish({
      name: values.name,
      email: values.email,
      company: values.company || "",
      phone: values.phone || "",
      address: addressParts,
      status: "Active",
      created_at: new Date().toISOString(),
    } as any);
  }

  return (
    <CreateView>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create Client</h1>
          <p className="text-sm text-muted-foreground">Add a new client to your account</p>
        </div>

        {!canCreateClient && (
          <Alert className="mb-6" variant="destructive">
            <AlertTitle>Client limit reached</AlertTitle>
            <AlertDescription>
              Your plan allows {entitlements.maxSavedClients} saved clients. You currently have {usage.savedClients}. Upgrade
              to add more clients.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Address */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold">Address</h2>
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="New York" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="NY" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="10001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => back()} disabled={formLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading || !canCreateClient}>
                {formLoading ? "Creating..." : "Create Client"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </CreateView>
  );
};
