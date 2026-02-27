interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
}

export default function AnimatedSection({ children, className = "" }: Props) {
  return <div className={className}>{children}</div>
}
