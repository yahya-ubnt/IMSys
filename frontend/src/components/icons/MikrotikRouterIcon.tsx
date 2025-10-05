import * as React from "react";
import { SVGProps } from "react";

const MikrotikRouterIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x={3} y={14} width={18} height={7} rx={2} ry={2} />
    <path d="M6 14v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
    <path d="M8 11h.01" />
    <path d="M12 11h.01" />
    <path d="M16 11h.01" />
  </svg>
);

export default MikrotikRouterIcon;
