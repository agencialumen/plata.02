"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface NotificationContextType {
  hasUnreadNotifications: boolean
  markNotificationsAsRead: () => void
  checkForNewNotifications: (userFollowers: number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const markNotificationsAsRead = () => {
    console.log("[v0] Marking notifications as read")
    setHasUnreadNotifications(false)
    if (isClient) {
      localStorage.setItem("isabelle-notification-read", "true")
    }
  }

  const checkForNewNotifications = (userFollowers: number) => {
    if (!isClient) {
      console.log("[v0] Not on client yet, skipping notification check")
      return
    }

    const hasRead = localStorage.getItem("isabelle-notification-read")
    console.log("[v0] Checking notifications - followers:", userFollowers, "hasRead:", hasRead)

    if (userFollowers === 1 && hasRead !== "true") {
      console.log("[v0] Setting unread notification to true")
      setHasUnreadNotifications(true)
    } else {
      console.log("[v0] No unread notifications")
      setHasUnreadNotifications(false)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        hasUnreadNotifications,
        markNotificationsAsRead,
        checkForNewNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
