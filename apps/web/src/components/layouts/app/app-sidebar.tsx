import { PlimIcon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { useProfile } from '@/hooks/use-profile'
import { useSubscription } from '@/hooks/use-subscription'
import { useAuthStore } from '@/stores/auth.store'
import { useInstallPromptStore } from '@/stores/install-prompt.store'
import { Link, useLocation } from '@tanstack/react-router'
import {
  ChevronsUpDown,
  CreditCard,
  Crown,
  Download,
  Home,
  LayoutDashboard,
  LogOut,
  Receipt,
  Tags,
  User,
} from 'lucide-react'

const navigation = [
  {
    title: 'Início',
    url: '/home',
    icon: Home,
    tutorialId: 'sidebar-nav-home',
  },
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    tutorialId: 'sidebar-nav-dashboard',
  },
  {
    title: 'Transações',
    url: '/transactions',
    icon: Receipt,
    tutorialId: 'sidebar-nav-expenses',
  },
  {
    title: 'Categorias',
    url: '/categories',
    icon: Tags,
    tutorialId: 'sidebar-nav-categories',
  },
  {
    title: 'Cartões',
    url: '/credit-cards',
    icon: CreditCard,
    tutorialId: 'sidebar-nav-credit-cards',
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { signOut, user } = useAuthStore()
  const { profile } = useProfile()
  const { isPro } = useSubscription()
  const { canPrompt, isInstalled, isIOS, promptInstall } = useInstallPrompt()
  const openIOSOverlay = useInstallPromptStore((s) => s.openIOSOverlay)

  const avatarUrl = profile?.avatar_url ?? user?.user_metadata?.avatar_url
  const displayName = profile?.name ?? user?.email?.split('@')[0]

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/home">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <PlimIcon className="size-8" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Plim</span>
                  <span className="text-xs text-muted-foreground">Finanças pessoais</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url} data-tutorial-id={item.tutorialId}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="size-8 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                      {displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col items-start text-left text-sm leading-tight min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 w-full">
                      <span className="truncate font-semibold">{displayName}</span>
                      {isPro && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] font-bold text-amber-500"
                        >
                          PRO
                        </Badge>
                      )}
                    </span>
                    <span className="truncate text-xs text-muted-foreground w-full">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" data-tutorial-id="sidebar-nav-profile">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/upgrade" data-tutorial-id="sidebar-nav-upgrade">
                    <Crown className="mr-2 h-4 w-4" />
                    Plano
                  </Link>
                </DropdownMenuItem>
                {!isInstalled && (canPrompt || isIOS) && (
                  <DropdownMenuItem onClick={() => (isIOS ? openIOSOverlay() : promptInstall())}>
                    <Download className="mr-2 h-4 w-4" />
                    Instalar app
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
