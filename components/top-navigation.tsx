"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Bell, User, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getIsabelleProfile } from "@/lib/firebase/firestore"
import { useNotifications } from "@/components/notification-provider"

interface TopNavigationProps {
  title?: string
  showBackButton?: boolean
  backHref?: string
  userProfile?: any
}

export function TopNavigation({
  title = "DeLuxe Isa",
  showBackButton = false,
  backHref = "/feed",
  userProfile,
}: TopNavigationProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
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

  const handleSearchClick = () => {
    setShowSearch(true)
    setShowNotifications(false)
  }

  const handleNotificationsClick = () => {
    setShowNotifications(true)
    setShowSearch(false)

    if (hasUnreadNotifications) {
      markNotificationsAsRead()
    }
  }

  const handleProfileClick = () => {
    if (userProfile?.username) {
      window.location.href = `/profile/${userProfile.username}`
    }
  }

  const closeModals = () => {
    setShowSearch(false)
    setShowNotifications(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Link href={backHref}>
                <Button variant="ghost" size="sm" className="rounded-full">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <h1 className="text-2xl font-bold text-primary">{title}</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="rounded-full" onClick={handleSearchClick}>
              <Search className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="sm" className="rounded-full relative" onClick={handleNotificationsClick}>
              <Bell className="h-5 w-5" />
              {hasUnreadNotifications && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">1</span>
                </div>
              )}
            </Button>

            <Button variant="ghost" size="sm" className="rounded-full" onClick={handleProfileClick}>
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

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
    </>
  )
}
