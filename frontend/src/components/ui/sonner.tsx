"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/hooks/useTheme";

const Toaster = ({ ...props }: ToasterProps) => {
  const { isDark, ready } = useTheme();

  return (
    <Sonner
      theme={ready ? (isDark ? "dark" : "light") : "system"}
      position="top-right"
      closeButton={false}
      {...props}
    />
  );
};

export { Toaster };
