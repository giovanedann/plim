import type * as React from 'react'

interface PlimIconProps extends React.SVGProps<SVGSVGElement> {}

const PlimIcon = (props: PlimIconProps) => (
  <svg width="64px" height="64px" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>{'Colorful Wallet Income'}</title>
    <g stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
      <path
        d="M10,28 L54,28 C56.209,28 58,29.791 58,32 L58,54 C58,56.209 56.209,58 54,58 L10,58 C7.791,58 6,56.209 6,54 L6,32 C6,29.791 7.791,28 10,28 Z"
        fill="#5D4037"
      />
      <path
        d="M6,36 L58,36 L58,54 C58,56.209 56.209,58 54,58 L10,58 C7.791,58 6,56.209 6,54 L6,36 Z"
        fill="#795548"
      />
      <rect fill="#A1887F" x={28} y={38} width={8} height={6} rx={2} />
      <g>
        <path d="M32,10 L32,18" stroke="#FFC107" strokeWidth={3} strokeLinecap="round" />
        <path d="M18,4 L18,10" stroke="#FFC107" strokeWidth={3} strokeLinecap="round" />
        <circle fill="#FFC107" cx={32} cy={26} r={6} />
        <circle fill="#FFD54F" cx={32} cy={26} r={3} />
        <circle fill="#FFC107" cx={18} cy={16} r={5} />
        <circle fill="#FFC107" cx={46} cy={20} r={5} />
        <text
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          fontSize={8}
          fill="#B38F00"
          x={43.5}
          y={23}
        >
          {'$'}
        </text>
      </g>
    </g>
  </svg>
)

export default PlimIcon
