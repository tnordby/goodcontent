"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  PanelsTopLeft,
  Building2,
  NotebookPen,
  AudioLines,
  Sparkles,
  SlidersHorizontal,
  PenSquare,
  WalletCards,
} from "lucide-react";

// Navigation menu items
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: PanelsTopLeft,
  },
  {
    title: "Company",
    url: "/brands",
    icon: Building2,
  },
  {
    title: "Briefs",
    url: "/briefs",
    icon: NotebookPen,
  },
  {
    title: "Interviews",
    url: "/interviews",
    icon: AudioLines,
  },
  {
    title: "Drafts",
    url: "/drafts",
    icon: Sparkles,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: SlidersHorizontal,
  },
  {
    title: "Billing",
    url: "/billing",
    icon: WalletCards,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="py-4 px-4">
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 p-1.5">
              <PenSquare className="size-full text-primary" />
            </div>
            <span className="text-base font-semibold group-data-[collapsible=icon]:hidden">
              GoodContent
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:overflow-y-auto group-data-[collapsible=icon]:overflow-x-hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="group-data-[collapsible=icon]:justify-center"
                    tooltip={item.title}
                  >
                    <a href={item.url}>
                      <item.icon className="size-[18px] shrink-0 stroke-[1.9]" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
