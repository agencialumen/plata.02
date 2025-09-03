"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Heart, MessageCircle, RefreshCw, Share, Settings } from "lucide-react"
import { TopNavigation } from "@/components/top-navigation"
import { BottomNavigation } from "@/components/bottom-navigation"
import { getUserByUsername, getUserRetweets, updateUserProfile } from "@/lib/firebase/firestore"
import { getDoc, doc } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase/config"
import { useToast } from "@/hooks/use-toast"

export default function UserProfile() {
  const params = useParams()
  const username = params.username as string
  const [user] = useAuthState(auth)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [retweetedPosts, setRetweetedPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: "",
    bio: "",
    profileImage: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await getUserByUsername(username)
        setUserProfile(profile)

        if (user) {
          const currentProfile = await getUserByUsername("admin") // Assuming current user is admin
          setCurrentUserProfile(currentProfile)
        }

        if (profile && username !== "isabellelua") {
          getUserRetweets(profile.uid, async (retweets) => {
            const postsWithRetweets = []
            for (const retweet of retweets) {
              try {
                const postDoc = await getDoc(doc(db, "posts", retweet.postId))
                if (postDoc.exists()) {
                  const postData = postDoc.data()
                  postsWithRetweets.push({
                    ...postData,
                    id: postDoc.id,
                    retweetedAt: retweet.createdAt,
                    isRetweet: true,
                  })
                }
              } catch (error) {
                console.error("Error fetching retweeted post:", error)
              }
            }
            setRetweetedPosts(postsWithRetweets)
          })
        } else if (username === "isabellelua") {
          const { getPostsByAuthor } = await import("@/lib/firebase/firestore")
          const userPosts = await getPostsByAuthor(username)
          setRetweetedPosts(userPosts)
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      loadData()
    }
  }, [username, user])

  const handleEditProfile = () => {
    setEditForm({
      displayName: userProfile.displayName || "",
      bio: userProfile.bio || "",
      profileImage: userProfile.profileImage || "",
    })
    setIsEditModalOpen(true)
  }

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(userProfile.uid, editForm)
      setUserProfile({ ...userProfile, ...editForm })
      setIsEditModalOpen(false)
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso!",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation title="Perfil" showBackButton={true} userProfile={currentUserProfile} />
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando perfil...</div>
        </div>
        <BottomNavigation userProfile={currentUserProfile} />
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <TopNavigation title="Perfil" showBackButton={true} userProfile={currentUserProfile} />
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-xl font-semibold">Perfil não encontrado</div>
          <Button onClick={() => window.history.back()}>Voltar ao Feed</Button>
        </div>
        <BottomNavigation userProfile={currentUserProfile} />
      </div>
    )
  }

  const isOwnProfile = currentUserProfile?.username === username
  const isIsabelleProfile = username === "isabellelua"

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation title={`@${username}`} showBackButton={true} userProfile={currentUserProfile} />

      <div className="max-w-md mx-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage
                src={userProfile.profileImage || "/placeholder.svg"}
                alt={userProfile.displayName || username}
              />
              <AvatarFallback className="text-lg">
                {(userProfile.displayName || username).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex space-x-2">
              {isOwnProfile ? (
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-transparent"
                      onClick={handleEditProfile}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Editar Perfil</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Nome</Label>
                        <Input
                          id="displayName"
                          value={editForm.displayName}
                          onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                          placeholder="Seu nome"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                          placeholder="Conte um pouco sobre você..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Avatar Anônimo</Label>
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            "/dark-hood-avatar-anonymous.png",
                            "/shadow-mask-avatar-cyberpunk.png",
                            "/ninja-silhouette-avatar-stealth.png",
                            "/ghost-phantom-avatar-mysterious.png",
                            "/void-entity-avatar-abstract.png",
                            "/digital-glitch-avatar-hacker.png",
                            "/smoke-shadow-avatar-enigma.png",
                            "/matrix-code-avatar-cyber.png",
                          ].map((avatar) => (
                            <button
                              key={avatar}
                              type="button"
                              onClick={() => setEditForm({ ...editForm, profileImage: avatar })}
                              className={`relative rounded-full p-1 transition-all ${
                                editForm.profileImage === avatar
                                  ? "ring-2 ring-primary bg-primary/10"
                                  : "hover:bg-secondary"
                              }`}
                            >
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={avatar || "/placeholder.svg"} alt="Avatar anônimo" />
                                <AvatarFallback className="bg-gray-800 text-gray-400">?</AvatarFallback>
                              </Avatar>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="profileImage">Ou URL personalizada</Label>
                        <Input
                          id="profileImage"
                          value={editForm.profileImage}
                          onChange={(e) => setEditForm({ ...editForm, profileImage: e.target.value })}
                          placeholder="https://exemplo.com/foto.jpg"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveProfile}>Salvar</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button size="sm" className="rounded-full">
                  Seguir
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold">{userProfile.displayName || username}</h1>
            {userProfile.bio && <p className="text-muted-foreground">{userProfile.bio}</p>}
          </div>

          <div className="flex space-x-6">
            <div className="text-center">
              <div className="font-bold text-lg">{retweetedPosts.length}</div>
              <div className="text-sm text-muted-foreground">{isIsabelleProfile ? "Posts" : "Retweets"}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{userProfile.followers || 0}</div>
              <div className="text-sm text-muted-foreground">Seguidores</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{userProfile.following || 0}</div>
              <div className="text-sm text-muted-foreground">Seguindo</div>
            </div>
          </div>
        </div>

        <div className="border-t border-border">
          <div className="flex">
            <div className="flex-1 p-4 text-center border-b-2 border-primary">
              <span className="font-medium text-primary">{isIsabelleProfile ? "Posts" : "Retweets"}</span>
            </div>
          </div>

          <div className="space-y-0">
            {retweetedPosts.length > 0 ? (
              retweetedPosts.map((post) => (
                <Card key={post.id} className="border-0 border-b border-border rounded-none">
                  <CardContent className="p-4">
                    {!isIsabelleProfile && post.isRetweet && (
                      <div className="flex items-center space-x-2 mb-2 text-muted-foreground text-sm">
                        <RefreshCw className="h-4 w-4" />
                        <span>{userProfile.displayName || username} retweetou</span>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={post.authorProfileImage || "/placeholder.svg"}
                          alt={post.authorDisplayName || post.authorUsername}
                        />
                        <AvatarFallback>
                          {(post.authorDisplayName || post.authorUsername).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{post.authorDisplayName || post.authorUsername}</span>
                          <span className="text-muted-foreground text-sm">@{post.authorUsername}</span>
                          <span className="text-muted-foreground text-sm">
                            {post.isRetweet && post.retweetedAt
                              ? new Date(post.retweetedAt.seconds * 1000).toLocaleDateString()
                              : new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm leading-relaxed">{post.content}</p>

                          {post.images && post.images.length > 0 && (
                            <div className="rounded-lg overflow-hidden">
                              <img
                                src={post.images[0] || "/placeholder.svg"}
                                alt="Post image"
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          )}

                          {post.videos && post.videos.length > 0 && (
                            <div className="rounded-lg overflow-hidden">
                              <video src={post.videos[0]} controls className="w-full h-auto" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                            <Heart className="h-4 w-4 mr-1" />
                            <span className="text-xs">{post.likes || 0}</span>
                          </Button>

                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-blue-500">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            <span className="text-xs">{post.comments || 0}</span>
                          </Button>

                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-green-500">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            <span className="text-xs">{post.retweets || 0}</span>
                          </Button>

                          <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <Share className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? isIsabelleProfile
                      ? "Você ainda não fez nenhum post"
                      : "Você ainda não retweetou nada"
                    : isIsabelleProfile
                      ? "Nenhum post ainda"
                      : "Nenhum retweet ainda"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNavigation userProfile={currentUserProfile} />
    </div>
  )
}
