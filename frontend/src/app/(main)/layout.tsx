"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { LeftSidebar } from "@/components/layout/LeftSidebar"
import { RightSidebar } from "@/components/layout/RightSidebar"
import { DarkModeToggle } from "@/components/layout/DarkModeToggle"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem("theme")
    if (saved === "dark") {
      setIsDark(true)
    }
  }, [])

  function toggleDark() {
    setIsDark((prev) => {
      const next = !prev
      window.localStorage.setItem("theme", next ? "dark" : "light")
      return next
    })
  }

  return (
    <div className={`_layout _layout_main_wrapper${isDark ? " _dark_wrapper" : ""}`}>
      <DarkModeToggle isDark={isDark} onToggle={toggleDark} />
      <div className="_main_layout">
        <Navbar />
        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <LeftSidebar />
              </div>
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">
                    {children}
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <RightSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
