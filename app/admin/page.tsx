"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Edit, Trash2, Heart, MessageCircle, RefreshCw, ArrowLeft, BarChart3, User, Save } from "lucide-react"
import Link from "next/link"
import { getPosts, deletePost, getIsabelleProfile, saveIsabelleProfile, type Post } from "@/lib/firebase/firestore"
import { CreatePostModal } from "@/components/admin/create-post-modal"
import { EditPostModal } from "@/components/admin/edit-post-modal"
import { useToast } from "@/components/toast-provider"

interface IsabelleProfile {
  displayName: string
  bio: string
  profileImage: string
  followers: number
  following: number
}

export default function AdminPanel() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const { showSuccess, showError, confirm } = useToast()

  const [isabelleProfile, setIsabelleProfile] = useState<IsabelleProfile>({
    displayName: "Isabelle Lua",
    bio: "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium\n📧 Contato: isabelle@deluxeisa.com",
    profileImage: "/beautiful-woman-profile.png",
    followers: 2400000,
    following: 1250,
  })
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    console.log("[v0] Admin panel loading posts...")
    const unsubscribe = getPosts((fetchedPosts) => {
      setPosts(fetchedPosts)
      setLoading(false)
    })

    const loadIsabelleProfile = async () => {
      try {
        const profile = await getIsabelleProfile()
        setIsabelleProfile({
          displayName: profile.displayName || "Isabelle Lua",
          bio:
            profile.bio ||
            "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium",
          profileImage: profile.profileImage || "/beautiful-woman-profile.png",
          followers: profile.followers || 2400000,
          following: profile.following || 1250,
        })
      } catch (error) {
        console.error("[v0] Error loading Isabelle profile:", error)
      }
    }

    loadIsabelleProfile()

    return unsubscribe
  }, [])

  const handleEditPost = (post: Post) => {
    setSelectedPost(post)
    setEditModalOpen(true)
  }

  const handleDeletePost = async (postId: string) => {
    const confirmed = await confirm(
      "Deletar Post",
      "Tem certeza que deseja deletar este post? Esta ação não pode ser desfeita.",
    )

    if (!confirmed) return

    try {
      console.log("[v0] Deleting post:", postId)
      await deletePost(postId)
      console.log("[v0] Post deleted successfully")

      showSuccess("Post deletado!", "O post foi removido com sucesso")
    } catch (error) {
      console.error("[v0] Error deleting post:", error)
      showError("Erro ao deletar", "Não foi possível deletar o post. Tente novamente.")
    }
  }

  const handleSaveProfile = async () => {
    setProfileLoading(true)
    try {
      console.log("[v0] Saving Isabelle profile:", isabelleProfile)
      await saveIsabelleProfile(isabelleProfile)

      showSuccess("Perfil atualizado!", "As informações da Isabelle foram salvas com sucesso")
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
      showError("Erro ao salvar", "Não foi possível salvar o perfil. Tente novamente.")
    } finally {
      setProfileLoading(false)
    }
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
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Data inválida"
    }
  }

  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0)
  const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0)
  const totalRetweets = posts.reduce((sum, post) => sum + (post.retweets || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link href="/feed">
              <Button variant="ghost" size="sm" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Painel Administrativo</h1>
          </div>
          <Button className="rounded-full glow-pink-hover" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Post
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="profile">Perfil Isabelle</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{posts.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Curtidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{formatNumber(totalLikes)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Comentários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">{formatNumber(totalComments)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Retweets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{formatNumber(totalRetweets)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Posts Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.slice(0, 5).map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={post.authorProfileImage || "/placeholder.svg"}
                            alt={post.authorDisplayName}
                          />
                          <AvatarFallback>IL</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium line-clamp-1">{post.content}</p>
                          <p className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {post.likes || 0}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {post.comments || 0}
                        </span>
                        <span className="flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {post.retweets || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Gerenciar Posts</h2>
              <Button className="rounded-full glow-pink-hover" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Post
              </Button>
            </div>

            <div className="grid gap-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={post.authorProfileImage || "/placeholder.svg"}
                              alt={post.authorDisplayName}
                            />
                            <AvatarFallback className="text-xs">IL</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{post.authorDisplayName}</span>
                          <span className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</span>
                        </div>

                        <p className="text-sm mb-3 leading-relaxed">{post.content}</p>

                        {post.images && post.images.length > 0 && (
                          <div className="mb-3">
                            <img
                              src={post.images[0] || "/placeholder.svg"}
                              alt="Post content"
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Heart className="h-3 w-3 mr-1" />
                            {formatNumber(post.likes || 0)}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            {formatNumber(post.comments || 0)}
                          </span>
                          <span className="flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            {formatNumber(post.retweets || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="ghost" size="sm" className="rounded-full" onClick={() => handleEditPost(post)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-red-500 hover:text-red-600"
                          onClick={() => post.id && handleDeletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center">
                <User className="h-5 w-5 mr-2" />
                Gerenciar Perfil da Isabelle
              </h2>
              <Button className="rounded-full glow-pink-hover" onClick={handleSaveProfile} disabled={profileLoading}>
                <Save className="h-4 w-4 mr-2" />
                {profileLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview do Perfil */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview do Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16 ring-4 ring-primary/20">
                      <AvatarImage src={isabelleProfile.profileImage || "/placeholder.svg"} alt="Isabelle Lua" />
                      <AvatarFallback className="text-xl">IL</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold">{isabelleProfile.displayName}</h3>
                        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground text-xs">✓</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">@isabellelua</p>
                    </div>
                  </div>

                  <div className="whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                    {isabelleProfile.bio}
                  </div>

                  <div className="flex justify-around py-2 border-t border-border">
                    <div className="text-center">
                      <div className="text-lg font-bold">{formatNumber(posts.length)}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{formatNumber(isabelleProfile.followers)}</div>
                      <div className="text-xs text-muted-foreground">Seguidores</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{formatNumber(isabelleProfile.following)}</div>
                      <div className="text-xs text-muted-foreground">Seguindo</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulário de Edição */}
              <Card>
                <CardHeader>
                  <CardTitle>Editar Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome de Exibição</label>
                    <Input
                      value={isabelleProfile.displayName}
                      onChange={(e) => setIsabelleProfile((prev) => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Nome de exibição"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Biografia</label>
                    <Textarea
                      value={isabelleProfile.bio}
                      onChange={(e) => setIsabelleProfile((prev) => ({ ...prev, bio: e.target.value }))}
                      placeholder="Biografia do perfil"
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL da Foto de Perfil</label>
                    <Input
                      value={isabelleProfile.profileImage}
                      onChange={(e) => setIsabelleProfile((prev) => ({ ...prev, profileImage: e.target.value }))}
                      placeholder="https://exemplo.com/foto.jpg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Seguidores</label>
                      <Input
                        type="number"
                        value={isabelleProfile.followers}
                        onChange={(e) =>
                          setIsabelleProfile((prev) => ({ ...prev, followers: Number.parseInt(e.target.value) || 0 }))
                        }
                        placeholder="Número de seguidores"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Seguindo</label>
                      <Input
                        type="number"
                        value={isabelleProfile.following}
                        onChange={(e) =>
                          setIsabelleProfile((prev) => ({ ...prev, following: Number.parseInt(e.target.value) || 0 }))
                        }
                        placeholder="Número seguindo"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Análises Detalhadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Análises detalhadas em desenvolvimento</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Em breve você poderá ver gráficos de engajamento, crescimento de seguidores e muito mais
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <CreatePostModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />

      <EditPostModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setSelectedPost(null)
        }}
        post={selectedPost}
      />
    </div>
  )
}
