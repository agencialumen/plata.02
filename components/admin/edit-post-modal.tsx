"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, ImageIcon, Loader2 } from "lucide-react"
import { updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Post } from "@/lib/firebase/firestore"

interface EditPostModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post | null
}

export function EditPostModal({ isOpen, onClose, post }: EditPostModalProps) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (post) {
      setContent(post.content)
      setImageUrl(post.images?.[0] || "")
    }
  }, [post])

  const handleSubmit = async () => {
    if (!post?.id || !content.trim()) return

    setLoading(true)
    try {
      await updateDoc(doc(db, "posts", post.id), {
        content: content.trim(),
        images: imageUrl ? [imageUrl] : [],
        updatedAt: new Date(),
      })

      onClose()
      alert("Post atualizado com sucesso!")
    } catch (error) {
      console.error("[v0] Error updating post:", error)
      alert("Erro ao atualizar post. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Editar Post</h2>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Author Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.authorProfileImage || "/placeholder.svg"} alt={post.authorDisplayName} />
              <AvatarFallback>IL</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{post.authorDisplayName}</h3>
              <p className="text-muted-foreground text-xs">@{post.authorUsername}</p>
            </div>
          </div>

          {/* Post Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que está acontecendo?"
            className="bg-transparent resize-none border-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
            rows={4}
          />

          {/* Image URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <ImageIcon className="h-4 w-4 mr-2" />
              URL da Imagem (opcional)
            </label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="bg-transparent"
            />
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={imageUrl || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-48 object-cover"
                onError={() => setImageUrl("")}
              />
            </div>
          )}

          {/* Character Count */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{content.length}/280</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || content.length > 280 || loading}
            className="rounded-full glow-pink-hover"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
