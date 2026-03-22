import React, { useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const hiddenRoutes = ["/", "/login", "/challenges", "/learn", "/dashboard/internal"];
  const isHiddenRoute = hiddenRoutes.includes(location.pathname);
  const isBuggyRoute = location.pathname === "/buggy";
  const isQuestionDetailRoute = /^\/(easy|medium|hard)\/[^/]+$/.test(
    location.pathname
  );
  const isInternalAdminDetailRoute =
    location.pathname === "/dashboard/internal/questions" ||
    location.pathname === "/dashboard/internal/chatbot";
  const forceCornerRoute = isBuggyRoute || isQuestionDetailRoute || isInternalAdminDetailRoute;
  const buttonRef = useRef(null);
  const [buttonOffset, setButtonOffset] = useState({ top: "16px", left: "16px" });

  useLayoutEffect(() => {
    if (isHiddenRoute) return;
    if (forceCornerRoute) {
      setButtonOffset({ top: "18px", left: "12px" });
      return;
    }

    const updateOffset = () => {
      const root = document.getElementById("root");
      if (!root) return;

      const pageRoot = Array.from(root.children).find((element) => {
        if (element === buttonRef.current) return false;
        if (!(element instanceof HTMLElement)) return false;
        return element.offsetParent !== null;
      });

      if (!pageRoot) {
        setButtonOffset({ top: "16px", left: "16px" });
        return;
      }

      const pageRect = pageRoot.getBoundingClientRect();
      const pageStyle = window.getComputedStyle(pageRoot);
      const pagePaddingLeft = parseFloat(pageStyle.paddingLeft) || 0;
      const pagePaddingTop = parseFloat(pageStyle.paddingTop) || 0;

      let anchorLeft = pageRect.left + pagePaddingLeft;
      const pageWidth = pageRect.width || window.innerWidth;

      const containerChild = Array.from(pageRoot.children).find((child) => {
        const childRect = child.getBoundingClientRect();
        if (childRect.width <= 0 || childRect.height <= 0) return false;

        const childStyle = window.getComputedStyle(child);
        const isCentered =
          childStyle.marginLeft === "auto" && childStyle.marginRight === "auto";
        const hasMaxWidth = childStyle.maxWidth !== "none";
        const widthRatio = pageWidth > 0 ? childRect.width / pageWidth : 0;

        return (isCentered || hasMaxWidth) && widthRatio >= 0.55;
      });

      if (containerChild) {
        const childRect = containerChild.getBoundingClientRect();
        const childStyle = window.getComputedStyle(containerChild);
        const childPaddingLeft = parseFloat(childStyle.paddingLeft) || 0;
        anchorLeft = childRect.left + childPaddingLeft;
      }

      const nextLeft = `${Math.max(12, Math.round(anchorLeft))}px`;
      const topBase = pageRect.top + Math.min(Math.max(pagePaddingTop, 12), 28);
      const nextTop = `${Math.max(12, Math.round(topBase))}px`;

      setButtonOffset((previous) =>
        previous.left === nextLeft && previous.top === nextTop
          ? previous
          : { left: nextLeft, top: nextTop }
      );
    };

    let frame = requestAnimationFrame(updateOffset);
    const handleResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateOffset);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [location.pathname, isHiddenRoute, forceCornerRoute]);

  if (isHiddenRoute) {
    return null;
  }

  const historyIndex = window.history.state?.idx;
  const canGoBack = typeof historyIndex === "number" && historyIndex > 0;
  const disableButton = !canGoBack && location.pathname === "/";

  const handleBack = () => {
    if (canGoBack) {
      navigate(-1);
      return;
    }

    if (location.pathname !== "/") {
      navigate("/");
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleBack}
      disabled={disableButton}
      aria-label="Go back"
      style={{
        position: "fixed",
        top: buttonOffset.top,
        left: buttonOffset.left,
        zIndex: 1000,
        margin: 0,
        border: "1px solid #334155",
        borderRadius: "6px",
        padding: "0.3rem 0.55rem",
        background: disableButton ? "#475569" : "#1e293b",
        color: "#f8fafc",
        cursor: disableButton ? "not-allowed" : "pointer",
        fontSize: "0.8rem",
        fontWeight: 500,
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
      }}
    >
      {"< Back"}
    </button>
  );
}

export default BackButton;
