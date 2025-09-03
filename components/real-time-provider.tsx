"use client"
import { createContext, useContext, useEffect, useState } from "react"
import type React from "react"

import { useAuthState } from "react-firebase-hooks/auth"
import { auth, db } from "@/lib/firebase/config"
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"
import { updateUserLastSeen } from "@/lib/firebase/firestore"

interface RealTimeContextType {
  newPostsCount: number
  hasNewNotifications: boolean
  markPostsAsRead: () => void
  markNotificationsAsRead: () => void
}

const RealTimeContext = createContext<RealTimeContextType>({
  newPostsCount: 0,
  hasNewNotifications: false,
  markPostsAsRead: () => {},
  markNotificationsAsRead: () => {},
})

export function RealTimeProvider({ children }: { children: React.ReactNode }) {
  const [user, loading, error] = useAuthState(auth)
  const [newPostsCount, setNewPostsCount] = useState(0)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const [lastSeenPostTime, setLastSeenPostTime] = useState<Date>(new Date())

  useEffect(() => {
    if (error) {
      console.error("[v0] Auth error in RealTimeProvider:", error)
      return
    }
    if (loading || !auth) {
      console.log("[v0] Auth loading or not available:", { loading, auth: !!auth })
      return
    }
  }, [loading, error])

  useEffect(() => {
    if (!db) {
      console.log("[v0] Firestore not available, skipping posts listener")
      return
    }

    const postsRef = collection(db, "posts")
    const q = query(postsRef, orderBy("createdAt", "desc"), limit(10))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let newCount = 0
      snapshot.docs.forEach((doc) => {
        const post = doc.data()
        if (post.createdAt && post.createdAt.toDate() > lastSeenPostTime) {
          newCount++
        }
      })
      setNewPostsCount(newCount)
    })

    return unsubscribe
  }, [lastSeenPostTime])

  useEffect(() => {
    if (!user || !db || loading) return

    const likesRef = collection(db, "likes")
    const retweetsRef = collection(db, "retweets")

    const unsubscribeLikes = onSnapshot(query(likesRef, orderBy("createdAt", "desc"), limit(5)), (snapshot) => {
      setHasNewNotifications(snapshot.docs.length > 0)
    })

    const unsubscribeRetweets = onSnapshot(query(retweetsRef, where("userId", "==", user.uid)), (snapshot) => {
      if (snapshot.docs.length > 0) {
        setHasNewNotifications(true)
      }
    })

    return () => {
      unsubscribeLikes()
      unsubscribeRetweets()
    }
  }, [user, loading])

  useEffect(() => {
    if (user && !loading && !error) {
      const updateLastSeen = () => updateUserLastSeen(user.uid)

      const interval = setInterval(updateLastSeen, 30000)
      updateLastSeen()

      return () => clearInterval(interval)
    }
  }, [user, loading, error])

  const markPostsAsRead = () => {
    setNewPostsCount(0)
    setLastSeenPostTime(new Date())
  }

  const markNotificationsAsRead = () => {
    setHasNewNotifications(false)
  }

  return (
    <RealTimeContext.Provider
      value={{
        newPostsCount,
        hasNewNotifications,
        markPostsAsRead,
        markNotificationsAsRead,
      }}
    >
      {children}
    </RealTimeContext.Provider>
  )
}

export const useRealTime = () => useContext(RealTimeContext)
