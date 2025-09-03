"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, ImageIcon, VideoIcon, Type, Loader2 } from "lucide-react"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "@/lib/firebase/config"
import { createPost, getIsabelleProfile } from "@/lib/firebase/firestore"
import { useToast } from "@/components/toast-provider"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
}

type PostType = "text" | "image" | "video"

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [user] = useAuthState(auth)
  const [content, setContent] = useState("")
  const [mediaUrl, setMediaUrl] = useState("")
  const [postType, setPostType] = useState<PostType>("text")
  const [loading, setLoading] = useState(false)
  const [isabelleProfile, setIsabelleProfile] = useState({
    displayName: "Isabelle Lua",
    profileImage: "/beautiful-woman-profile.png",
  })

  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (isOpen) {
      const fetchIsabelleProfile = async () => {
        try {
          console.log("[v0] Fetching Isabelle profile for modal...")
          const profile = await getIsabelleProfile()
          console.log("[v0] Isabelle profile fetched:", profile)
          setIsabelleProfile({
            displayName: profile.displayName || "Isabelle Lua",
            profileImage: profile.profileImage || "/beautiful-woman-profile.png",
          })
        } catch (error) {
          console.error("[v0] Error fetching Isabelle profile:", error)
        }
      }
      fetchIsabelleProfile()
    }
  }, [isOpen])

  const handleSubmit = async () => {
    console.log("[v0] handleSubmit called", {
      content: content.trim(),
      postType,
      mediaUrl,
      contentLength: content.length,
    })

    if (!content.trim()) {
      console.log("[v0] Validation failed - no content")
      showError("Erro de validação", "Por favor, escreva algum conteúdo para o post.")
      return
    }

    if (content.length > 280) {
      console.log("[v0] Validation failed - content too long")
      showError("Erro de validação", "O conteúdo não pode ter mais de 280 caracteres.")
      return
    }

    console.log("[v0] Starting post creation...")
    setLoading(true)
    try {
      const postData = {
        authorId: "isabelle-lua-admin",
        authorUsername: "isabellelua",
        authorDisplayName: isabelleProfile.displayName,
        authorProfileImage: isabelleProfile.profileImage,
        content: content.trim(),
        images: postType === "image" && mediaUrl ? [mediaUrl] : [],
        videos: postType === "video" && mediaUrl ? [mediaUrl] : [],
        likes: 0,
        comments: 0,
        retweets: 0,
      }

      console.log("[v0] Post data prepared:", postData)
      await createPost(postData)
      console.log("[v0] Post created successfully")

      showSuccess("Post criado!", "Seu post foi publicado com sucesso no feed.")

      setContent("")
      setMediaUrl("")
      setPostType("text")
      onClose()
    } catch (error) {
      console.error("[v0] Error creating post:", error)
      showError("Erro ao criar post", "Não foi possível publicar o post. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const getPlaceholderText = () => {
    switch (postType) {
      case "text":
        return "Escreva uma mensagem inspiradora..."
      case "image":
        return "Descreva sua foto..."
      case "video":
        return "Conte sobre seu vídeo..."
      default:
        return "O que está acontecendo?"
    }
  }

  const getMediaPlaceholder = () => {
    switch (postType) {
      case "image":
        return "https://exemplo.com/imagem.jpg"
      case "video":
        return "https://exemplo.com/video.mp4"
      default:
        return ""
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Criar Novo Post</h2>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={isabelleProfile.profileImage || "/placeholder.svg"} alt="Isabelle Lua" />
              <AvatarFallback>IL</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{isabelleProfile.displayName}</h3>
              <p className="text-muted-foreground text-xs">@isabellelua</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant={postType === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPostType("text")
                setMediaUrl("")
              }}
              className="flex items-center space-x-2"
            >
              <Type className="h-4 w-4" />
              <span>Texto</span>
            </Button>
            <Button
              variant={postType === "image" ? "default" : "outline"}
              size="sm"
              onClick={() => setPostType("image")}
              className="flex items-center space-x-2"
            >
              <ImageIcon className="h-4 w-4" />
              <span>Foto</span>
            </Button>
            <Button
              variant={postType === "video" ? "default" : "outline"}
              size="sm"
              onClick={() => setPostType("video")}
              className="flex items-center space-x-2"
            >
              <VideoIcon className="h-4 w-4" />
              <span>Vídeo</span>
            </Button>
          </div>

          {/* Post Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getPlaceholderText()}
            className="bg-transparent resize-none border-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
            rows={postType === "text" ? 6 : 3}
          />

          {postType !== "text" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center">
                {postType === "image" ? (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    URL da Imagem
                  </>
                ) : (
                  <>
                    <VideoIcon className="h-4 w-4 mr-2" />
                    URL do Vídeo
                  </>
                )}
              </label>
              <Input
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder={getMediaPlaceholder()}
                className="bg-transparent"
              />
            </div>
          )}

          {mediaUrl && postType === "image" && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={mediaUrl || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-48 object-cover"
                onError={() => setMediaUrl("")}
              />
            </div>
          )}

          {mediaUrl && postType === "video" && (
            <div className="rounded-lg overflow-hidden border border-border">
              <video src={mediaUrl} className="w-full h-48 object-cover" controls onError={() => setMediaUrl("")}>
                Seu navegador não suporta vídeos.
              </video>
            </div>
          )}

          {/* Character Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center space-x-2">
              <span>{content.length}/280</span>
              {postType !== "text" && (
                <span className="text-xs bg-muted px-2 py-1 rounded-full">
                  {postType === "image" ? "📸 Foto" : "🎥 Vídeo"}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              console.log("[v0] Publish button clicked", {
                content: content.trim(),
                disabled: !content.trim() || content.length > 280 || loading,
              })
              handleSubmit()
            }}
            disabled={!content.trim() || content.length > 280 || loading}
            className="rounded-full glow-pink-hover"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              "Publicar"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
