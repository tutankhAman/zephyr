"use client";

import { Menu } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import Friends from "./left/Friends";
import NavigationCard from "./left/NavigationCard";

const LeftSideBar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [screenSize, setScreenSize] = useState("large");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setScreenSize("small");
      } else if (window.innerWidth < 1024) {
        setScreenSize("medium");
        setIsCollapsed(true);
      } else {
        setScreenSize("large");
        setIsCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarWidth = () => {
    if (screenSize === "small") return "w-0";
    if (screenSize === "medium" || (isCollapsed && !isHovered)) return "w-16";
    return "w-72";
  };

  return (
    <aside
      className={`transition-all duration-300 ease-in-out ${sidebarWidth()} hidden bg-[hsl(var(--background-alt))] p-2 md:block`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {screenSize !== "small" && (
        <div className="flex flex-col space-y-4">
          <div
            className={`ml-1 flex ${isCollapsed && !isHovered ? "justify-center" : "justify-start"}`}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`${isCollapsed && !isHovered ? "h-8 w-8 p-0" : "w-full justify-center"}`}
            >
              <Menu
                className={`text-muted-foreground ${
                  isCollapsed && !isHovered ? "h-6 w-6" : "h-6 w-6"
                }`}
              />
            </Button>
          </div>
          <div
            className={`space-y-4 ${isCollapsed && !isHovered ? "px-0" : "px-2"}`}
          >
            <NavigationCard isCollapsed={isCollapsed && !isHovered} />
            <Friends isCollapsed={isCollapsed && !isHovered} />
          </div>
        </div>
      )}
    </aside>
  );
};

export default LeftSideBar;
