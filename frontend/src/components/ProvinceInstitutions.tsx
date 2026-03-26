import type { ProvinceConfig } from '@/lib/provinces-config'

interface ProvinceInstitutionsProps {
  institutions: ProvinceConfig['institutions']
}

export default function ProvinceInstitutions({ institutions }: ProvinceInstitutionsProps) {
  if (institutions.length === 0) return null

  return (
    <div>
      <div
        style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '2.5px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-ui)',
          marginBottom: '14px',
        }}
      >
        Key Players
      </div>
      <p
        style={{
          fontSize: '15px',
          lineHeight: 1.8,
          fontFamily: 'var(--font-ui)',
          margin: 0,
        }}
      >
        {institutions.map((institution, i) => (
          <span key={institution.name}>
            {i > 0 && (
              <span
                style={{
                  margin: '0 6px',
                  color: 'var(--text-muted)',
                }}
              >
                ·
              </span>
            )}
            <span
              style={{
                fontWeight: institution.type === 'lab' ? 600 : 400,
                color:
                  institution.type === 'lab'
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)',
              }}
            >
              {institution.name}
            </span>
          </span>
        ))}
      </p>
    </div>
  )
}
