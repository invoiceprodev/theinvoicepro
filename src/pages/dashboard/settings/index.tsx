import { type HttpError, useGetIdentity } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingOverlay } from "@/components/refine-ui/layout/loading-overlay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Building2, Mail, Phone, MapPin, DollarSign, Image as ImageIcon } from "lucide-react";
import { supabaseClient } from "@/lib/supabase";
import type { Profile } from "@/types";

const settingsFormSchema = z.object({
  company_name: z.string().optional(),
  business_email: z.string().email({ message: "Please enter a valid email address." }).optional().or(z.literal("")),
  business_phone: z.string().optional(),
  business_address: z.string().optional(),
  currency: z.string().optional(),
  logo_url: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "ZAR", label: "ZAR - South African Rand" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "INR", label: "INR - Indian Rupee" },
];

export default function SettingsPage() {
  const { data: user } = useGetIdentity<Profile>();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.logo_url || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<Profile, HttpError, SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      company_name: user?.company_name || "",
      business_email: user?.business_email || "",
      business_phone: user?.business_phone || "",
      business_address: user?.business_address || "",
      currency: user?.currency || "ZAR",
    },
    refineCoreProps: {
      resource: "profiles",
      action: "edit",
      id: user?.id,
      redirect: false,
      successNotification: {
        message: "Business settings updated successfully",
        type: "success",
      },
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !user?.id) return null;

    setUploadingLogo(true);
    try {
      const fileExt = logoFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabaseClient.storage.from("business-logos").upload(filePath, logoFile, {
        cacheControl: "3600",
        upsert: true,
      });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseClient.storage.from("business-logos").getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading logo:", error);
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  async function onSubmit(values: SettingsFormValues) {
    let logoUrl = user?.logo_url;

    if (logoFile) {
      const uploadedUrl = await uploadLogo();
      if (uploadedUrl) {
        logoUrl = uploadedUrl;
      }
    }

    onFinish({
      ...values,
      logo_url: logoUrl,
    });
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Business Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your business profile and preferences for invoicing</p>
      </div>

      <LoadingOverlay loading={formLoading}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Business Logo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Business Logo
                </CardTitle>
                <CardDescription>Upload your business logo to appear on invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  {logoPreview ? (
                    <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="logo-upload"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <label htmlFor="logo-upload">
                      <Button type="button" variant="outline" asChild>
                        <span className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          {logoPreview ? "Change Logo" : "Upload Logo"}
                        </span>
                      </Button>
                    </label>
                    <p className="text-sm text-muted-foreground mt-2">
                      PNG, JPG or SVG. Max 2MB. Recommended: 200x200px
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
                <CardDescription>Your business details that will appear on invoices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Business Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="billing@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Business Phone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="business_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Business Address
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="123 Business St, Suite 100&#10;City, State 12345&#10;Country"
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Full business address for invoices</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Currency Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Currency Preferences
                </CardTitle>
                <CardDescription>Default currency for new invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Currency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>This will be the default currency for all new invoices</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={formLoading || uploadingLogo}>
                {(formLoading || uploadingLogo) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploadingLogo ? "Uploading..." : formLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </LoadingOverlay>
    </div>
  );
}
