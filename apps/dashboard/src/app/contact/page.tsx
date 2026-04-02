import Link from 'next/link'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link href="/" className="text-blue-400 hover:underline mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-5xl font-bold mb-8">Contact Us</h1>
        
        <div className="space-y-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-slate-300 mb-6">Have questions? We'd love to hear from you.</p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">General Inquiries</h3>
                <a href="mailto:support@governapi.com" className="text-blue-400 hover:underline">
                  support@governapi.com
                </a>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Sales & Demos</h3>
                <a href="mailto:sales@governapi.com" className="text-blue-400 hover:underline">
                  sales@governapi.com
                </a>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Technical Support</h3>
                <p className="text-slate-400">Check our <Link href="/docs" className="text-blue-400 hover:underline">documentation</Link> or email support</p>
              </div>
            </div>
          </div>
          
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
            <p className="text-slate-300">
              <span className="font-semibold text-white">Response Time:</span> We typically respond within 24 hours on weekdays
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
