"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconServer,
  IconShield,
  IconCpu,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

interface SidebarDemoProps {
  children: React.ReactNode;
}

export default function SidebarDemo({ children }: SidebarDemoProps) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    // Redirect first, then logout to prevent Layout redirect
    window.location.href = 'http://localhost:3001/patches';
    await logout();
  };

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-white dark:text-neutral-200" />
      ),
    },
    {
      label: "Assets",
      href: "/dashboard/assets",
      icon: (
        <IconServer className="h-5 w-5 shrink-0 text-white dark:text-neutral-200" />
      ),
    },
    {
      label: "Patches",
      href: "/dashboard/patches",
      icon: (
        <IconShield className="h-5 w-5 shrink-0 text-white dark:text-neutral-200" />
      ),
    },
    {
      label: "Agents",
      href: "/dashboard/agents",
      icon: (
        <IconCpu className="h-5 w-5 shrink-0 text-white dark:text-neutral-200" />
      ),
    },
  ];

  return (
    <div className="flex h-screen w-full">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <ReconifyLogo /> : <ReconifyLogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: user?.name || "User",
                href: "#",
                icon: (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                ),
              }}
            />
            <button
              onClick={handleSignOut}
              className="flex items-center justify-start gap-2 group/sidebar py-2 w-full"
            >
              <IconArrowLeft className="h-5 w-5 shrink-0 text-white dark:text-neutral-200" />
              <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="text-white dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
              >
                Sign Out
              </motion.span>
            </button>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export const ReconifyLogo = () => {
  return (
    <Link
      href="http://localhost:3001/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold whitespace-pre text-white dark:text-white"
      >
        RECONIFY
      </motion.span>
    </Link>
  );
};

export const ReconifyLogoIcon = () => {
  return (
    <Link
      href="http://localhost:3001/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black">
          <circle cx="12" cy="12" r="10"/>
          <circle cx="12" cy="12" r="6"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      </div>
    </Link>
  );
};
