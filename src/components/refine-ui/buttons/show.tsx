"use client";

import React from "react";
import { type BaseKey, useShowButton } from "@refinedev/core";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardFeatureAccess } from "@/hooks/use-dashboard-feature-access";
import { isSubscriptionGateExemptResource } from "@/lib/subscription-access";

type ShowButtonProps = {
  /**
   * Resource name for API data interactions. `identifier` of the resource can be used instead of the `name` of the resource.
   * @default Inferred resource name from the route
   */
  resource?: string;
  /**
   * Data item identifier for the actions with the API
   * @default Reads `:id` from the URL
   */
  recordItemId?: BaseKey;
  /**
   * Access Control configuration for the button
   * @default `{ enabled: true, hideIfUnauthorized: false }`
   */
  accessControl?: {
    enabled?: boolean;
    hideIfUnauthorized?: boolean;
  };
  /**
   * `meta` property is used when creating the URL for the related action and path.
   */
  meta?: Record<string, unknown>;
} & React.ComponentProps<typeof Button>;

export const ShowButton = React.forwardRef<
  React.ComponentRef<typeof Button>,
  ShowButtonProps
>(
  (
    { resource, recordItemId, accessControl, meta, children, onClick, ...rest },
    ref,
  ) => {
    const { hidden, disabled, LinkComponent, to, label } = useShowButton({
      resource,
      id: recordItemId,
      accessControl,
      meta,
    });
    const { isBlocked, showBlockedMessage } = useDashboardFeatureAccess();

    const isDisabled = disabled || rest.disabled;
    const isHidden = hidden || rest.hidden;
    const shouldGate = isBlocked && !isSubscriptionGateExemptResource(resource);

    if (isHidden) return null;

    if (shouldGate) {
      return (
        <Button
          {...rest}
          ref={ref}
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onClick?.(event);
            showBlockedMessage();
          }}>
          {children ?? (
            <div className="flex items-center gap-2 font-semibold">
              <Eye className="h-4 w-4" />
              <span>{label}</span>
            </div>
          )}
        </Button>
      );
    }

    return (
      <Button {...rest} ref={ref} disabled={isDisabled} asChild>
        <LinkComponent to={to} replace={false}>
          {children ?? (
            <div className="flex items-center gap-2 font-semibold">
              <Eye className="h-4 w-4" />
              <span>{label}</span>
            </div>
          )}
        </LinkComponent>
      </Button>
    );
  },
);

ShowButton.displayName = "ShowButton";
