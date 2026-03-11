import * as React from "react"
import {
  useRefineOptions,
  useActiveAuthProvider,
  useLogout,
} from "@refinedev/core"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle"
import { UserAvatar } from "@/components/refine-ui/layout/user-avatar"
import { useSidebar, SidebarTrigger } from "@/components/ui/sidebar"
import { LogOutIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getProfileBridgeSnapshot, subscribeProfileBridge } from "@/lib/profile-bridge"

export const Header = () => {
  const { isMobile } = useSidebar()

  return <>{isMobile ? <MobileHeader /> : <DesktopHeader />}</>
}

function DesktopHeader() {
  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-16",
        "shrink-0",
        "items-center",
        "gap-4",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-end",
        "z-40",
      )}
    >
      <ThemeToggle />
      <UserDropdown />
    </header>
  )
}

function MobileHeader() {
  const { open, openMobile, isMobile } = useSidebar()
  const { title } = useRefineOptions()
  const [profileSnapshot, setProfileSnapshot] = React.useState(getProfileBridgeSnapshot())

  React.useEffect(() => subscribeProfileBridge(setProfileSnapshot), [])

  const defaultTitleText = typeof title.text === "string" ? title.text : "InvoicePro"
  const companyName = profileSnapshot.profile?.company_name?.trim() || defaultTitleText
  const logoUrl = profileSnapshot.profile?.logo_url || null
  const sidebarOpen = isMobile ? openMobile : open

  return (
    <header
      className={cn(
        "sticky",
        "top-0",
        "flex",
        "h-12",
        "shrink-0",
        "items-center",
        "gap-2",
        "border-b",
        "border-border",
        "bg-sidebar",
        "pr-3",
        "justify-between",
        "z-40",
      )}
    >
      <SidebarTrigger
        className={cn("text-muted-foreground", "rotate-180", "ml-1", {
          "opacity-0": sidebarOpen,
          "opacity-100": !sidebarOpen || isMobile,
          "pointer-events-auto": !sidebarOpen || isMobile,
          "pointer-events-none": sidebarOpen && !isMobile,
        })}
      />

      <div
        className={cn(
          "whitespace-nowrap",
          "flex",
          "flex-row",
          "h-full",
          "items-center",
          "justify-start",
          "gap-2",
          "transition-discrete",
          "duration-200",
          {
            "pl-3": !sidebarOpen,
            "pl-5": sidebarOpen,
          },
        )}
      >
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background",
          )}
        >
          {logoUrl ? <img src={logoUrl} alt={companyName} className={cn("h-full", "w-full", "object-contain")} /> : title.icon}
        </div>
        <div
          className={cn("min-w-0 transition-opacity duration-200", {
            "opacity-0": !sidebarOpen,
            "opacity-100": sidebarOpen,
          })}
        >
          <h2 className={cn("truncate text-sm font-bold")}>{companyName}</h2>
          {companyName !== defaultTitleText ? <p className={cn("truncate text-[11px] text-muted-foreground")}>{defaultTitleText}</p> : null}
        </div>
      </div>

      <ThemeToggle className={cn("h-8", "w-8")} />
    </header>
  )
}

const UserDropdown = () => {
  const { mutate: logout, isPending: isLoggingOut } = useLogout()

  const authProvider = useActiveAuthProvider()

  if (!authProvider?.getIdentity) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            logout()
          }}
        >
          <LogOutIcon
            className={cn("text-destructive", "hover:text-destructive")}
          />
          <span className={cn("text-destructive", "hover:text-destructive")}>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

Header.displayName = "Header"
MobileHeader.displayName = "MobileHeader"
DesktopHeader.displayName = "DesktopHeader"
