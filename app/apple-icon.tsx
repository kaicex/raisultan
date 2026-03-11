import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 180,
  height: 180,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #07111f 0%, #1a4832 100%)',
          borderRadius: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '82px',
            color: '#f8fafc',
            fontWeight: 800,
          }}
        >
          PX
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
