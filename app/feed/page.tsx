"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, MoreHorizontal, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"
import {
  getPosts,
  checkUserLiked,
  toggleLike,
  toggleRetweet,
  getUserProfile,
  checkUserRetweeted,
  followUser,
  createNotification,
  type Post,
} from "@/lib/firebase/firestore"
import { CommentModal } from "@/components/comment-modal"
import { useRealTime } from "@/components/real-time-provider"
import { useToast } from "@/components/toast-provider"
import { BottomNavigation } from "@/components/bottom-navigation"
import { TopNavigation } from "@/components/top-navigation"

export default function FeedPage() {
  const [user] = useAuthState(auth)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [retweetedPosts, setRetweetedPosts] = useState<Set<string>>(new Set())
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  const { newPostsCount, hasNewNotifications, markPostsAsRead, markNotificationsAsRead } = useRealTime()
  const { showWarning, showError, showSuccess } = useToast()

  useEffect(() => {
    const unsubscribe = getPosts((fetchedPosts) => {
      setPosts(fetchedPosts)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const checkLikedPosts = async () => {
      if (!user || posts.length === 0) return

      const likedSet = new Set<string>()
      for (const post of posts) {
        if (post.id) {
          const isLiked = await checkUserLiked(user.uid, post.id)
          if (isLiked) {
            likedSet.add(post.id)
          }
        }
      }
      setLikedPosts(likedSet)
    }

    checkLikedPosts()
  }, [user, posts])

  useEffect(() => {
    const checkRetweetedPosts = async () => {
      if (!user || posts.length === 0) return

      const retweetedSet = new Set<string>()
      for (const post of posts) {
        if (post.id) {
          const isRetweeted = await checkUserRetweeted(user.uid, post.id)
          if (isRetweeted) {
            retweetedSet.add(post.id)
          }
        }
      }
      setRetweetedPosts(retweetedSet)
    }

    checkRetweetedPosts()
  }, [user, posts])

  useEffect(() => {
    const handleScroll = () => {
      if (newPostsCount > 0) {
        markPostsAsRead()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [newPostsCount, markPostsAsRead])

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return

      try {
        const profile = await getUserProfile(user.uid)
        console.log("[v0] User profile loaded:", profile)
        setUserProfile(profile)

        if (profile && profile.followers === 0) {
          console.log("[v0] New user detected, initiating auto-follow by Isabelle")

          setTimeout(async () => {
            try {
              console.log("[v0] Auto-following user by Isabelle")
              await followUser("isabelle-lua-uid", user.uid)

              console.log("[v0] Creating notification for auto-follow")
              await createNotification(user.uid, {
                type: "follow",
                fromUserId: "isabelle-lua-uid",
                fromUsername: "isabellelua",
                fromDisplayName: "Isabelle Lua",
                message: "começou a te seguir",
                createdAt: new Date(),
              })

              console.log("[v0] Auto-follow and notification completed")
            } catch (error) {
              console.error("[v0] Error in auto-follow system:", error)
            }
          }, 2000)
        }
      } catch (error) {
        console.error("[v0] Error loading user profile:", error)
      }
    }

    fetchUserProfile()
  }, [user])

  const handleLike = async (postId: string) => {
    if (!user) {
      showWarning("Login necessário", "Você precisa estar logado para curtir posts")
      return
    }

    try {
      const wasLiked = await toggleLike(user.uid, postId)

      setLikedPosts((prev) => {
        const newSet = new Set(prev)
        if (wasLiked) {
          newSet.add(postId)
        } else {
          newSet.delete(postId)
        }
        return newSet
      })

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, likes: (post.likes || 0) + (wasLiked ? 1 : -1) } : post,
        ),
      )
    } catch (error) {
      console.error("[v0] Error toggling like:", error)
      showError("Erro ao curtir", "Não foi possível curtir o post. Tente novamente.")
    }
  }

  const handleComment = (postId: string) => {
    if (!user) {
      showWarning("Login necessário", "Você precisa estar logado para comentar")
      return
    }

    setSelectedPostId(postId)
    setCommentModalOpen(true)
  }

  const handleShare = async (postId: string) => {
    if (!user) {
      showWarning("Login necessário", "Você precisa estar logado para retuitar")
      return
    }

    try {
      const post = posts.find((p) => p.id === postId)
      if (!post) return

      const wasRetweeted = await toggleRetweet(user.uid, postId, post.authorId)

      setRetweetedPosts((prev) => {
        const newSet = new Set(prev)
        if (wasRetweeted) {
          newSet.add(postId)
        } else {
          newSet.delete(postId)
        }
        return newSet
      })

      if (wasRetweeted) {
        showSuccess("Post retuitado!", "O post foi adicionado ao seu perfil")
      } else {
        showSuccess("Retweet removido", "O post foi removido do seu perfil")
      }
    } catch (error) {
      console.error("[v0] Error toggling retweet:", error)
      showError("Erro ao retuitar", "Não foi possível retuitar o post. Tente novamente.")
    }
  }

  const handleCommentAdded = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === postId ? { ...post, comments: (post.comments || 0) + 1 } : post)),
    )
  }

  const handleRefresh = () => {
    markPostsAsRead()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation userProfile={userProfile} />

        {/* Loading State */}
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando posts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation userProfile={userProfile} />

      {newPostsCount > 0 && (
        <div className="sticky top-16 z-40 bg-primary/10 border-b border-primary/20">
          <div className="max-w-md mx-auto p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:bg-primary/20"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {newPostsCount} novo{newPostsCount > 1 ? "s" : ""} post{newPostsCount > 1 ? "s" : ""} • Clique para ver
            </Button>
          </div>
        </div>
      )}

      {/* Feed */}
      <main className="max-w-md mx-auto pb-20">
        {posts.length === 0 ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <p className="text-muted-foreground">Nenhum post encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Os posts da Isabelle aparecerão aqui quando forem publicados
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {posts.map((post) => (
              <Card key={post.id} className="border-border/50 fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Link
                      href="/profile/isabellelua"
                      className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                        <AvatarImage
                          src={post.authorProfileImage || "/beautiful-woman-profile.png"}
                          alt={post.authorDisplayName}
                        />
                        <AvatarFallback>IL</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-1">
                          <h3 className="font-semibold text-sm">{post.authorDisplayName}</h3>
                          <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-xs">✓</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          @{post.authorUsername} • {formatTimestamp(post.createdAt)}
                        </p>
                      </div>
                    </Link>
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

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-full p-2 ${
                          post.id && likedPosts.has(post.id) ? "text-red-500" : "text-muted-foreground"
                        } hover:text-red-500 transition-colors`}
                        onClick={() => post.id && handleLike(post.id)}
                      >
                        <Heart className={`h-5 w-5 ${post.id && likedPosts.has(post.id) ? "fill-current" : ""}`} />
                        <span className="ml-1 text-xs">{formatNumber(post.likes || 0)}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full p-2 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => post.id && handleComment(post.id)}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="ml-1 text-xs">{formatNumber(post.comments || 0)}</span>
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full p-2 ${
                        post.id && retweetedPosts.has(post.id) ? "text-green-500" : "text-muted-foreground"
                      } hover:text-green-500 transition-colors`}
                      onClick={() => post.id && handleShare(post.id)}
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
              Carregar mais posts
            </Button>
          </div>
        )}
      </main>

      {/* Comment Modal */}
      <CommentModal
        isOpen={commentModalOpen}
        onClose={() => {
          setCommentModalOpen(false)
          setSelectedPostId(null)
        }}
        postId={selectedPostId}
        onCommentAdded={handleCommentAdded}
      />

      {/* Bottom Navigation */}
      <BottomNavigation userProfile={userProfile} />
    </div>
  )
}
