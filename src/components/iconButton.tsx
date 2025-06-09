import { KnownIconType } from "@charcoal-ui/icons";
import { ButtonHTMLAttributes, useEffect, useState } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconName: keyof KnownIconType;
  isProcessing: boolean;
  label?: string;
};

// 기본 아이콘 SVG 정의
const iconSvgs: Record<string, JSX.Element> = {
  "24/Microphone": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <path d="M12 19v3"></path>
    </svg>
  ),
  "24/PauseAlt": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" rx="1"></rect>
      <rect x="14" y="4" width="4" height="16" rx="1"></rect>
    </svg>
  ),
  "24/Send": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"></path>
      <path d="M22 2 11 13"></path>
    </svg>
  ),
  "24/Add": (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" strokeDasharray="2"></circle>
      <path d="M12 8v8"></path>
      <path d="M8 12h8"></path>
    </svg>
  )
};

export const IconButton = ({
  iconName,
  isProcessing,
  label,
  ...rest
}: Props) => {
  // SVG 아이콘만 사용하여 렌더링 (웹 컴포넌트 없이도 작동)
  const icon = isProcessing 
    ? iconSvgs["24/Add"] 
    : iconSvgs[iconName as string] || (
      <svg width="24" height="24" viewBox="0 0 24 24">
        <rect width="24" height="24" fill="currentColor" opacity="0.2" />
      </svg>
    );

  return (
    <button
      {...rest}
      className={`bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled text-white rounded-lg text-sm p-1 text-center inline-flex items-center mr-2
        ${rest.className}
      `}
    >
      {icon}
      {label && <div className="mx-2 font-bold">{label}</div>}
    </button>
  );
};
