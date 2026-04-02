import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/" className="text-blue-400 hover:underline mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-5xl font-bold mb-8">About GovernAPI</h1>
        
        <div className="space-y-6 text-slate-300 text-lg">
          <p>
            GovernAPI provides enterprise-grade API security and governance for modern development teams.
          </p>
          
          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Our Mission</h2>
          <p>
            We believe every company deserves enterprise-grade API security without enterprise complexity. 
            Our mission is to make API governance accessible, automated, and actionable.
          </p>
          
          <h2 className="text-3xl font-bold text-white mt-12 mb-4">Why GovernAPI?</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Deploy in minutes, not weeks</li>
            <li>AI-powered threat detection</li>
            <li>Real-time security monitoring</li>
            <li>Automated compliance reporting</li>
          </ul>
          
          <div className="mt-12 pt-8 border-t border-slate-700">
            <p className="text-center">
              <a href="mailto:support@governapi.com" className="text-blue-400 hover:underline">Contact us: support@governapi.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
