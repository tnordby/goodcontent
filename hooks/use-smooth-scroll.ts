import { useCallback } from "react";

export const useSmoothScroll = () => {
  const scroolToSection = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const element = document.querySelector(id);
      if (element) {
        const headerOffset = 60;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    },
    []
  );

  return { scroolToSection };
};
