"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Home, Search, Bell, User, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { getIsabelleProfile } from "@/lib/firebase/firestore"
import { useNotifications } from "@/components/notification-provider"

interface BottomNavigationProps {
  userProfile?: {
    uid: string
    username: string
    followers?: number
  } | null
}

export function BottomNavigation({ userProfile }: BottomNavigationProps) {
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isabelleProfile, setIsabelleProfile] = useState<any>(null)

  const { hasUnreadNotifications, markNotificationsAsRead, checkForNewNotifications } = useNotifications()

  useEffect(() => {
    const loadIsabelleProfile = async () => {
      try {
        const profile = await getIsabelleProfile()
        setIsabelleProfile(profile)
      } catch (error) {
        console.error("Error loading Isabelle profile:", error)
      }
    }
    loadIsabelleProfile()
  }, [])

  useEffect(() => {
    if (userProfile?.followers) {
      checkForNewNotifications(userProfile.followers)
    }
  }, [userProfile?.followers, checkForNewNotifications])

  const isabelleAvatar = isabelleProfile?.profileImage || "/beautiful-woman-profile.png"

  const handleNotificationsClick = () => {
    setShowNotifications(true)
    setShowSearch(false)

    if (hasUnreadNotifications) {
      markNotificationsAsRead()
    }
  }

  const handleSearchClick = () => {
    setShowSearch(true)
    setShowNotifications(false)
  }

  const closeModals = () => {
    setShowSearch(false)
    setShowNotifications(false)
  }

  const isActive = (path: string) => {
    if (path === "/feed") return pathname === "/feed" || pathname === "/"
    if (path === "/profile") return pathname.startsWith("/profile")
    return pathname === path
  }

  return (
    <>
      {showSearch && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
          <Card className="w-full max-w-md mx-4 animate-in slide-in-from-top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Buscar</CardTitle>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={closeModals}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">Perfis recomendados:</div>

              <Link href="/profile/isabellelua" onClick={closeModals}>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarImage src={isabelleAvatar || "/placeholder.svg"} alt="Isabelle Lua" />
                    <AvatarFallback>IL</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <h3 className="font-semibold">Isabelle Lua</h3>
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">@isabellelua</p>
                    <p className="text-xs text-muted-foreground">Modelo & Influenciadora Digital</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                    Ver perfil
                  </Button>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
          <Card className="w-full max-w-md mx-4 animate-in slide-in-from-top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Notificações</CardTitle>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={closeModals}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {userProfile?.followers > 0 && (
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={isabelleAvatar || "/placeholder.svg"} alt="Isabelle Lua" />
                    <AvatarFallback>IL</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">Isabelle Lua</span>{" "}
                      <span className="text-muted-foreground">começou a te seguir</span>
                    </p>
                    <p className="text-xs text-muted-foreground">agora</p>
                  </div>
                </div>
              )}

              {userProfile?.followers === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔔</div>
                  <p className="text-muted-foreground">Nenhuma notificação</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border z-40">
        <div className="flex items-center justify-around p-4 max-w-md mx-auto">
          <Link href="/feed">
            <Button
              variant="ghost"
              size="sm"
              className={`rounded-full ${isActive("/feed") ? "text-primary" : "text-muted-foreground"}`}
            >
              <div className="flex flex-col items-center space-y-1">
                <Home className="h-6 w-6" />
                <span className="text-xs">Feed</span>
              </div>
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full ${isActive("/search") ? "text-primary" : "text-muted-foreground"}`}
            onClick={handleSearchClick}
          >
            <div className="flex flex-col items-center space-y-1">
              <Search className="h-6 w-6" />
              <span className="text-xs">Buscar</span>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full text-muted-foreground relative`}
            onClick={handleNotificationsClick}
          >
            <div className="flex flex-col items-center space-y-1">
              <Bell className="h-6 w-6" />
              <span className="text-xs">Notificações</span>
              {hasUnreadNotifications && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">1</span>
                </div>
              )}
            </div>
          </Button>

          {userProfile ? (
            <Link href={`/profile/${userProfile.username}`}>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-full ${isActive("/profile") ? "text-primary" : "text-muted-foreground"}`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <User className="h-6 w-6" />
                  <span className="text-xs">Perfil</span>
                </div>
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground">
              <div className="flex flex-col items-center space-y-1">
                <User className="h-6 w-6" />
                <span className="text-xs">Perfil</span>
              </div>
            </Button>
          )}
        </div>
      </nav>
    </>
  )
}
