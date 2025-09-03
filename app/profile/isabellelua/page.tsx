"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, MessageCircle, Heart, RefreshCw } from "lucide-react"
import { getPostsByAuthor, getIsabelleProfile } from "@/lib/firebase/firestore"
import { BottomNavigation } from "@/components/bottom-navigation"
import { TopNavigation } from "@/components/top-navigation"

interface FirebasePost {
  id: string
  content: string
  images: string[]
  videos: string[] // Added videos field
  likes: number
  comments: number
  createdAt: any
}

interface IsabelleProfile {
  displayName: string
  bio: string
  profileImage: string
  followers: number
  following: number
}

export default function IsabelleLuaProfile() {
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts")
  const [isFollowing, setIsFollowing] = useState(false)
  const [posts, setPosts] = useState<FirebasePost[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<IsabelleProfile | null>(null) // Added profile state

  useEffect(() => {
    const loadData = async () => {
      try {
        const isabellePosts = await getPostsByAuthor("isabellelua")
        const isabelleProfile = await getIsabelleProfile()

        setPosts(isabellePosts)
        setProfile(isabelleProfile)
      } catch (error) {
        console.error("Error loading Isabelle data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "agora"

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

      if (diffInMinutes < 1) return "agora"
      if (diffInMinutes < 60) return `${diffInMinutes}m`
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`
      return `${Math.floor(diffInMinutes / 1440)}d`
    } catch (error) {
      return "agora"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <TopNavigation
        title="@isabellelua"
        showBackButton={true}
        backHref="/feed"
        userProfile={{ username: "isabellelua" }}
      />

      <main className="max-w-md mx-auto">
        {/* Profile Header */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage src={profile?.profileImage || "/beautiful-woman-profile.png"} alt="Isabelle Lua" />
              <AvatarFallback className="text-2xl font-bold">IL</AvatarFallback>
            </Avatar>

            <div className="flex space-x-2">
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                className="rounded-full px-6 glow-pink-hover"
                onClick={() => setIsFollowing(!isFollowing)}
              >
                {isFollowing ? "Seguindo" : "Seguir"}
              </Button>
              <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold">{profile?.displayName || "Isabelle Lua"}</h2>
              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs">✓</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {profile?.bio ||
                "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium\n📧 Contato: isabelle@deluxeisa.com"}
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-around py-4">
            <div className="text-center">
              <div className="text-xl font-bold">{formatNumber(posts.length)}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{formatNumber(profile?.followers || 2400000)}</div>
              <div className="text-xs text-muted-foreground">Seguidores</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{formatNumber(profile?.following || 1250)}</div>
              <div className="text-xs text-muted-foreground">Seguindo</div>
            </div>
          </div>

          {/* Story Highlights */}
          <div className="flex space-x-4 py-2">
            {["Ensaios", "Lifestyle", "Beauty", "Travel"].map((highlight, index) => (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 p-0.5">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                    <span className="text-xs font-medium">{highlight[0]}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-border">
          <div className="flex">
            <Button
              variant="ghost"
              className={`flex-1 py-3 rounded-none border-b-2 ${
                activeTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setActiveTab("posts")}
            >
              Posts
            </Button>
            <Button
              variant="ghost"
              className={`flex-1 py-3 rounded-none border-b-2 ${
                activeTab === "saved" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setActiveTab("saved")}
            >
              Salvos
            </Button>
          </div>
        </div>

        {/* Posts Timeline */}
        <div className="pb-20">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-full bg-muted animate-pulse rounded mb-2" />
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="text-4xl">📝</div>
              <div className="text-lg font-semibold">Nenhum post ainda</div>
              <div className="text-sm text-muted-foreground">Os posts da Isabelle aparecerão aqui</div>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {posts.map((post) => (
                <Card key={post.id} className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          <AvatarImage
                            src={profile?.profileImage || "/beautiful-woman-profile.png"}
                            alt="Isabelle Lua"
                          />
                          <AvatarFallback>IL</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-1">
                            <h3 className="font-semibold text-sm">{profile?.displayName || "Isabelle Lua"}</h3>
                            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-foreground text-xs">✓</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            @isabellelua • {formatTimestamp(post.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <p className="text-sm mb-3 leading-relaxed">{post.content}</p>

                    {post.images && post.images.length > 0 && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <img
                          src={post.images[0] || "/placeholder.svg"}
                          alt="Post content"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}

                    {post.videos && post.videos.length > 0 && (
                      <div className="mb-4 rounded-lg overflow-hidden">
                        <video src={post.videos[0]} controls className="w-full h-auto object-cover" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full p-2 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Heart className="h-5 w-5" />
                          <span className="ml-1 text-xs">{formatNumber(post.likes || 0)}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full p-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <MessageCircle className="h-5 w-5" />
                          <span className="ml-1 text-xs">{formatNumber(post.comments || 0)}</span>
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full p-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <RefreshCw className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load more */}
          {posts.length > 0 && (
            <div className="p-4">
              <Button variant="outline" className="w-full rounded-full border-border hover:bg-secondary bg-transparent">
                Ver mais posts
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation userProfile={{ username: "isabellelua" }} />
    </div>
  )
}
