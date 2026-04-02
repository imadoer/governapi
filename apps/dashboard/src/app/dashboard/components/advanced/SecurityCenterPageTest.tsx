"use client";

export function SecurityCenterPageTest() {
  return (
    <div style={{
      minHeight: '100vh',
      margin: '-2rem',
      padding: '2rem',
      background: 'linear-gradient(135deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)',
    }}>
      <h1 style={{ color: 'white', fontSize: '48px' }}>
        EDGE TEST - Rainbow Background
      </h1>
      <p style={{ color: 'white', fontSize: '24px' }}>
        Does this rainbow extend to ALL corners/edges?
      </p>
      <p style={{ color: 'white', fontSize: '18px', marginTop: '20px' }}>
        If you see gaps at the edges, the parent container has padding we need to override!
      </p>
    </div>
  );
}
