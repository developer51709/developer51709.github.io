export function Footer() {
  return (
    <div className="content footer">
      <div style={{ borderTop: '1px solid rgba(0,255,0,0.15)', paddingTop: '2rem' }}>
        <p style={{ opacity: 0.4, fontSize: '0.8rem' }}>
          © {new Date().getFullYear()} soren · Built with precision & caffeine
        </p>
      </div>
    </div>
  )
}
