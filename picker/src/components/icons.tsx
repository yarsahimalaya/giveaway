import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function make(children: ReactNode) {
  return function Icon({ size = 20, ...props }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        {children}
      </svg>
    );
  };
}

export const ArrowRight = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const ArrowLeft = make(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const Upload = make(<path d="M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />);
export const FileText = make(<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4" />);
export const Close = make(<path d="M18 6L6 18M6 6l12 12" />);
export const Check = make(<path d="M5 12.5l4.5 4.5L19 7" />);
export const Plus = make(<path d="M12 5v14M5 12h14" />);
export const Minus = make(<path d="M5 12h14" />);
export const Search = make(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>);
export const Trophy = make(<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />);
export const Copy = make(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></>);
export const Download = make(<path d="M12 4v12M7 11l5 5 5-5M4 20h16" />);
export const External = make(<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />);
export const Expand = make(<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />);
export const Shrink = make(<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />);
export const Volume = make(<path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />);
export const VolumeOff = make(<path d="M4 9v6h4l5 4V5L8 9zM17 9.5l5 5M22 9.5l-5 5" />);
export const Ban = make(<><circle cx="12" cy="12" r="9" /><path d="M5.7 5.7l12.6 12.6" /></>);
export const Sparkle = make(<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />);
export const Redo = make(<path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />);
export const Users = make(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" /></>);
export const Filter = make(<path d="M4 5h16l-6 7.5V19l-4 1.5v-8z" />);
export const Settings = make(<path d="M4 7h10M18 7h2M4 17h4M12 17h8M16 4.5v5M10 14.5v5" />);
export const Clipboard = make(<path d="M9 3.5h6v3H9zM9 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H15M9 12h6M9 16h4" />);
export const Shield = make(<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5" />);
export const Layers = make(<><rect x="5" y="4" width="14" height="16" rx="3" /><path d="M9 12h6" /></>);
export const Grid = make(<><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></>);
export const Zap = make(<path d="M13 3L4 14h7l-1 7 9-11h-7z" />);
export const Pencil = make(<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />);
export const Restore = make(<path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v5h5" />);
