import { useState } from 'react'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { PixelIcon, type PixelIconName } from './PixelIcon'

interface Project {
  name: string
  url: string
  description: string
  icon: PixelIconName
  tech: string[]
}

const PROJECTS: Project[] = [
  {
    name: 'Linavo',
    url: 'https://linavo.indevs.in',
    description: 'Power without complexity. Build, run, and understand your technology from one place. Linavo brings AI, applications, infrastructure, and insights together.',
    icon: 'bolt',
    tech: ['AI', 'Infrastructure', 'Web Platform'],
  },
  {
    name: 'Niko',
    url: 'https://niko.sryze.cc',
    description: 'A warm, capable Discord companion for communities that care.',
    icon: 'robot',
    tech: ['Discord Bot', 'AI', 'Community'],
  },
]

export function Projects({ visible }: { visible: boolean }) {
  if (!visible) return null

  return (
    <div id="projects-section" className="content scroll-reveal dashed-border">
      <h2 className="section-title">Projects</h2>
      <div className="projects-grid">
        {PROJECTS.map((project, index) => (
          <ProjectCard key={project.name} project={project} delay={index * 150} />
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project, delay }: { project: Project; delay: number }) {
  const [hovered, setHovered] = useState(false)
  const { ref, isVisible } = useScrollReveal<HTMLAnchorElement>(0.2)

  return (
    <a
      ref={ref}
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className="project-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
        border: `1px solid ${hovered ? '#00ff00' : 'rgba(0,255,0,0.2)'}`,
        boxShadow: hovered ? '0 0 20px rgba(0,255,0,0.15), inset 0 0 20px rgba(0,255,0,0.05)' : 'none',
      }}
    >
      <div className="project-card-header">
        <PixelIcon name={project.icon} size={28} style={{ color: '#00ff00', flexShrink: 0 }} />
        <h3 style={{ margin: 0, color: '#00ff00', fontSize: '1.2rem', textShadow: '0 0 8px rgba(0,255,0,0.5)' }}>
          {project.name}
        </h3>
        <span
          style={{
            marginLeft: 'auto',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(-10px)',
            transition: 'all 0.3s ease-out',
            color: '#00ff00',
            flexShrink: 0,
          }}
        >
          <PixelIcon name="external-link" size={16} />
        </span>
      </div>
      <p style={{ color: '#b0b0b0', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 1rem' }}>
        {project.description}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {project.tech.map((t) => (
          <span
            key={t}
            style={{
              fontSize: '0.7rem',
              padding: '0.2rem 0.5rem',
              border: '1px solid rgba(0,255,0,0.3)',
              borderRadius: '2px',
              color: 'rgba(0,255,0,0.7)',
              letterSpacing: '0.5px',
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </a>
  )
}
