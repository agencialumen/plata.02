import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  setDoc, // Adicionando setDoc para criar documentos
} from "firebase/firestore"
import { db } from "./config"

// Tipos de dados
export interface UserProfile {
  uid: string
  username: string
  displayName: string
  bio: string
  profileImage: string
  followers: number
  following: number
  createdAt: any
  updatedAt: any
  lastSeen?: any
}

export interface Post {
  id?: string
  authorId: string
  authorUsername: string
  authorDisplayName: string
  authorProfileImage: string
  content: string
  images: string[]
  videos: string[] // Adicionando campo videos para suportar posts de vídeo
  likes: number
  comments: number
  retweets: number
  createdAt: any
  updatedAt: any
}

export interface Like {
  id?: string
  userId: string
  postId: string
  createdAt: any
}

export interface Comment {
  id?: string
  userId: string
  postId: string
  username: string
  displayName: string
  profileImage: string
  content: string
  createdAt: any
}

export interface Retweet {
  id?: string
  userId: string
  postId: string
  originalAuthorId: string
  createdAt: any
}

// Funções para Posts
export const createPost = async (postData: Omit<Post, "id" | "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("[v0] Error creating post:", error)
    throw error
  }
}

export const getPosts = (callback: (posts: Post[]) => void) => {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50))

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[]
    callback(posts)
  })
}

export const getPostsByAuthor = async (authorUsername: string): Promise<Post[]> => {
  try {
    console.log("[v0] Getting posts by author:", authorUsername)
    const postsRef = collection(db, "posts")
    const q = query(postsRef, where("authorUsername", "==", authorUsername))
    const querySnapshot = await getDocs(q)

    console.log("[v0] Query snapshot size:", querySnapshot.size)

    const posts = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      console.log("[v0] Post found:", { id: doc.id, authorUsername: data.authorUsername, content: data.content })
      return {
        id: doc.id,
        ...data,
      }
    }) as Post[]

    const sortedPosts = posts.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return b.createdAt.toMillis() - a.createdAt.toMillis()
    })

    console.log("[v0] Total posts found for", authorUsername, ":", posts.length)
    return sortedPosts
  } catch (error) {
    console.error("[v0] Error getting posts by author:", error)
    return []
  }
}

// Funções para Perfis de Usuário
export const createUserProfile = async (profileData: Omit<UserProfile, "createdAt" | "updatedAt">) => {
  try {
    await updateDoc(doc(db, "users", profileData.uid), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("[v0] Error creating user profile:", error)
    throw error
  }
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "users", uid)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { uid, ...docSnap.data() } as UserProfile
    }
    return null
  } catch (error) {
    console.error("[v0] Error getting user profile:", error)
    throw error
  }
}

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    await updateDoc(doc(db, "users", uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("[v0] Error updating user profile:", error)
    throw error
  }
}

// Funções para Curtidas
export const toggleLike = async (userId: string, postId: string) => {
  try {
    const likesRef = collection(db, "likes")
    const q = query(likesRef, where("userId", "==", userId), where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Adicionar curtida
      await addDoc(likesRef, {
        userId,
        postId,
        createdAt: serverTimestamp(),
      })

      // Incrementar contador no post
      await updateDoc(doc(db, "posts", postId), {
        likes: increment(1),
      })

      return true // Curtiu
    } else {
      // Remover curtida
      const likeDoc = querySnapshot.docs[0]
      await deleteDoc(likeDoc.ref)

      // Decrementar contador no post
      await updateDoc(doc(db, "posts", postId), {
        likes: increment(-1),
      })

      return false // Descurtiu
    }
  } catch (error) {
    console.error("[v0] Error toggling like:", error)
    throw error
  }
}

export const checkUserLiked = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const likesRef = collection(db, "likes")
    const q = query(likesRef, where("userId", "==", userId), where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    return !querySnapshot.empty
  } catch (error) {
    console.error("[v0] Error checking user liked:", error)
    return false
  }
}

// Funções para Retweets
export const toggleRetweet = async (userId: string, postId: string, originalAuthorId: string) => {
  try {
    const retweetsRef = collection(db, "retweets")
    const q = query(retweetsRef, where("userId", "==", userId), where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Adicionar retweet
      await addDoc(retweetsRef, {
        userId,
        postId,
        originalAuthorId,
        createdAt: serverTimestamp(),
      })

      // Incrementar contador no post
      await updateDoc(doc(db, "posts", postId), {
        retweets: increment(1),
      })

      return true // Retweetou
    } else {
      // Remover retweet
      const retweetDoc = querySnapshot.docs[0]
      await deleteDoc(retweetDoc.ref)

      // Decrementar contador no post
      await updateDoc(doc(db, "posts", postId), {
        retweets: increment(-1),
      })

      return false // Removeu retweet
    }
  } catch (error) {
    console.error("[v0] Error toggling retweet:", error)
    throw error
  }
}

export const getUserRetweets = (userId: string, callback: (retweets: Retweet[]) => void) => {
  const q = query(collection(db, "retweets"), where("userId", "==", userId))

  return onSnapshot(q, (snapshot) => {
    const retweetDocs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Retweet[]

    // Ordenar manualmente no cliente para evitar índice composto
    const sortedRetweets = retweetDocs.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return b.createdAt.toMillis() - a.createdAt.toMillis()
    })

    callback(sortedRetweets)
  })
}

// Função para verificar se usuário retweetou um post
export const checkUserRetweeted = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const retweetsRef = collection(db, "retweets")
    const q = query(retweetsRef, where("userId", "==", userId), where("postId", "==", postId))
    const querySnapshot = await getDocs(q)

    return !querySnapshot.empty
  } catch (error) {
    console.error("[v0] Error checking user retweeted:", error)
    return false
  }
}

// Funções para Comentários
export const addComment = async (commentData: Omit<Comment, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, "comments"), {
      ...commentData,
      createdAt: serverTimestamp(),
    })

    // Incrementar contador de comentários no post
    await updateDoc(doc(db, "posts", commentData.postId), {
      comments: increment(1),
    })

    return docRef.id
  } catch (error) {
    console.error("[v0] Error adding comment:", error)
    throw error
  }
}

export const getPostComments = (postId: string, callback: (comments: Comment[]) => void) => {
  const q = query(collection(db, "comments"), where("postId", "==", postId))

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[]

    // Ordenar no lado do cliente para evitar índice composto
    const sortedComments = comments.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return b.createdAt.toMillis() - a.createdAt.toMillis()
    })

    callback(sortedComments)
  })
}

// Funções adicionais
export const ensureUserDocument = async (uid: string, userData?: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      console.log("[v0] Creating user document with data:", userData)

      const defaultUserData = {
        uid,
        username: userData?.username || `user_${uid.slice(0, 8)}`,
        displayName: userData?.displayName || userData?.username || "Usuário",
        bio: userData?.bio || "",
        profileImage: userData?.profileImage || "",
        followers: 0, // Iniciando com 0, será incrementado quando Isabelle seguir
        following: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      }

      await setDoc(userRef, defaultUserData, { merge: true })
      console.log("[v0] User document created with username:", defaultUserData.username)

      try {
        console.log("[v0] Starting auto-follow process for new user:", uid)

        // Garantir que o documento da Isabelle existe antes do auto-follow
        await ensureIsabelleUserDocument()
        console.log("[v0] Isabelle user document ensured")

        // Isabelle segue o novo usuário
        const followResult = await followUser("isabelle-lua-uid", uid)
        console.log("[v0] Follow result:", followResult)

        // Buscar dados atualizados da Isabelle para a notificação
        const isabelleProfile = await getIsabelleProfile()
        console.log("[v0] Isabelle profile loaded for notification:", isabelleProfile.displayName)

        // Criar notificação de que Isabelle seguiu o usuário
        await createNotification({
          userId: uid,
          type: "follow",
          message: "Isabelle Lua começou a te seguir",
          fromUserId: "isabelle-lua-uid",
          fromUsername: "isabellelua",
          fromDisplayName: isabelleProfile.displayName,
          fromProfileImage: isabelleProfile.profileImage,
        })

        console.log("[v0] Notification created successfully for user:", uid)
        console.log("[v0] Isabelle auto-followed new user:", uid)
      } catch (error) {
        console.error("[v0] Error in auto-follow process:", error)
      }
    } else {
      if (userData && userData.username) {
        await updateDoc(userRef, {
          username: userData.username,
          displayName: userData.displayName || userData.username,
          updatedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        })
        console.log("[v0] User document updated with username:", userData.username)
      }
    }
  } catch (error) {
    console.error("[v0] Error ensuring user document:", error)
    throw error
  }
}

export const updateUserLastSeen = async (uid: string) => {
  try {
    // Primeiro garantir que o documento existe
    await ensureUserDocument(uid)

    // Depois atualizar o lastSeen
    await updateDoc(doc(db, "users", uid), {
      lastSeen: serverTimestamp(),
    })
  } catch (error) {
    console.error("[v0] Error updating last seen:", error)
    // Não relançar o erro para não quebrar a aplicação
  }
}

export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  try {
    // Caso especial para o perfil da Isabelle
    if (username === "isabellelua") {
      const isabelleProfile = await ensureIsabelleProfile()
      return {
        uid: "isabelle-lua-uid",
        username: "isabellelua",
        displayName: isabelleProfile.displayName,
        bio: isabelleProfile.bio,
        profileImage: isabelleProfile.profileImage,
        followers: isabelleProfile.followers,
        following: isabelleProfile.following,
        createdAt: isabelleProfile.createdAt,
        updatedAt: isabelleProfile.updatedAt,
      } as UserProfile
    }

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("username", "==", username), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { uid: doc.id, ...doc.data() } as UserProfile
    }
    return null
  } catch (error) {
    console.error("[v0] Error getting user by username:", error)
    return null
  }
}

// Funções para deletar posts
export const deletePost = async (postId: string) => {
  try {
    console.log("[v0] Deleting post:", postId)

    // Deletar o post
    await deleteDoc(doc(db, "posts", postId))

    // Deletar todas as curtidas relacionadas
    const likesRef = collection(db, "likes")
    const likesQuery = query(likesRef, where("postId", "==", postId))
    const likesSnapshot = await getDocs(likesQuery)

    const deletePromises = []
    likesSnapshot.forEach((likeDoc) => {
      deletePromises.push(deleteDoc(likeDoc.ref))
    })

    // Deletar todos os comentários relacionados
    const commentsRef = collection(db, "comments")
    const commentsQuery = query(commentsRef, where("postId", "==", postId))
    const commentsSnapshot = await getDocs(commentsQuery)

    commentsSnapshot.forEach((commentDoc) => {
      deletePromises.push(deleteDoc(commentDoc.ref))
    })

    // Deletar todos os retweets relacionados
    const retweetsRef = collection(db, "retweets")
    const retweetsQuery = query(retweetsRef, where("postId", "==", postId))
    const retweetsSnapshot = await getDocs(retweetsQuery)

    retweetsSnapshot.forEach((retweetDoc) => {
      deletePromises.push(deleteDoc(retweetDoc.ref))
    })

    // Executar todas as deleções
    await Promise.all(deletePromises)

    console.log("[v0] Post and related data deleted successfully")
    return true
  } catch (error) {
    console.error("[v0] Error deleting post:", error)
    throw error
  }
}

// Funções para perfil específico da Isabelle
export const getIsabelleProfile = async () => {
  try {
    const docRef = doc(db, "profiles", "isabelle-lua")
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    }

    // Retornar dados padrão se não existir
    return {
      displayName: "Isabelle Lua",
      bio: "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium",
      profileImage: "/beautiful-woman-profile.png",
      followers: 2400000,
      following: 1250,
    }
  } catch (error) {
    console.error("[v0] Error getting Isabelle profile:", error)
    // Retornar dados padrão em caso de erro
    return {
      displayName: "Isabelle Lua",
      bio: "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium",
      profileImage: "/beautiful-woman-profile.png",
      followers: 2400000,
      following: 1250,
    }
  }
}

export const saveIsabelleProfile = async (profileData: any) => {
  try {
    await setDoc(
      doc(db, "profiles", "isabelle-lua"),
      {
        ...profileData,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
    console.log("[v0] Isabelle profile saved successfully")
  } catch (error) {
    console.error("[v0] Error saving Isabelle profile:", error)
    throw error
  }
}

export const ensureIsabelleProfile = async () => {
  try {
    const docRef = doc(db, "profiles", "isabelle-lua")
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.log("[v0] Creating Isabelle profile document...")

      const defaultIsabelleProfile = {
        displayName: "Isabelle Lua",
        bio: "✨ Modelo & Influenciadora Digital\n💄 Beauty & Lifestyle Content\n🌟 Conteúdo Exclusivo Premium",
        profileImage: "/beautiful-woman-profile.png",
        followers: 2400000,
        following: 1250,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(docRef, defaultIsabelleProfile)
      console.log("[v0] Isabelle profile created successfully")
      return defaultIsabelleProfile
    }

    return docSnap.data()
  } catch (error) {
    console.error("[v0] Error ensuring Isabelle profile:", error)
    throw error
  }
}

export const ensureIsabelleUserDocument = async () => {
  try {
    const isabelleUid = "isabelle-lua-uid"
    const userRef = doc(db, "users", isabelleUid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      console.log("[v0] Creating Isabelle user document...")

      const isabelleProfile = await getIsabelleProfile()

      const isabelleUserData = {
        uid: isabelleUid,
        username: "isabellelua",
        displayName: isabelleProfile.displayName,
        bio: isabelleProfile.bio,
        profileImage: isabelleProfile.profileImage,
        followers: isabelleProfile.followers,
        following: isabelleProfile.following,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      }

      await setDoc(userRef, isabelleUserData)
      console.log("[v0] Isabelle user document created successfully")
      return isabelleUserData
    }

    return { uid: isabelleUid, ...userSnap.data() }
  } catch (error) {
    console.error("[v0] Error ensuring Isabelle user document:", error)
    throw error
  }
}

export const followUser = async (followerId: string, followedId: string) => {
  try {
    const followsRef = collection(db, "follows")
    const q = query(followsRef, where("followerId", "==", followerId), where("followedId", "==", followedId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Adicionar follow
      await addDoc(followsRef, {
        followerId,
        followedId,
        createdAt: serverTimestamp(),
      })

      // Incrementar contador de seguidores do usuário seguido
      await updateDoc(doc(db, "users", followedId), {
        followers: increment(1),
      })

      // Incrementar contador de seguindo do usuário que seguiu
      await updateDoc(doc(db, "users", followerId), {
        following: increment(1),
      })

      return true
    }
    return false
  } catch (error) {
    console.error("[v0] Error following user:", error)
    throw error
  }
}

export const createNotification = async (notificationData: {
  userId: string
  type: string
  message: string
  fromUserId?: string
  fromUsername?: string
  fromDisplayName?: string
  fromProfileImage?: string
}) => {
  try {
    await addDoc(collection(db, "notifications"), {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("[v0] Error creating notification:", error)
    throw error
  }
}

export const getUserNotifications = (userId: string, callback: (notifications: any[]) => void) => {
  const q = query(collection(db, "notifications"), where("userId", "==", userId), limit(20))

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Ordenar no lado do cliente
    const sortedNotifications = notifications.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0
      return b.createdAt.toMillis() - a.createdAt.toMillis()
    })

    callback(sortedNotifications)
  })
}

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    })
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error)
    throw error
  }
}
