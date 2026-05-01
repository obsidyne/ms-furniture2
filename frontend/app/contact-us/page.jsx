import Navbar from "@/components/Navbar";

export default function ContactUs() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-ink mb-8">Contact Us</h1>
        <div className="prose prose-sm max-w-none text-muted leading-relaxed space-y-6">
          <p>Have questions or need assistance? Reach out to us through any of the following channels.</p>
          
          <div className="grid sm:grid-cols-2 gap-8 mt-12">
            <div className="p-6 bg-warm-white rounded-sm border border-border">
              <h2 className="text-lg font-medium text-ink mb-2">Our Showroom</h2>
              <p className="text-muted text-sm leading-relaxed">
                VHPH+RQ9, Curzon Rd, Kallupalam,<br />
                Thangassery, Kollam, Kerala 691013
              </p>
            </div>
            
            <div className="p-6 bg-warm-white rounded-sm border border-border">
              <h2 className="text-lg font-medium text-ink mb-2">Contact Details</h2>
              <p className="text-muted text-sm leading-relaxed">
                Phone: 99953 22809<br />
                Email: hello@msfurniture.in
              </p>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-medium text-ink mb-4">Business Hours</h2>
            <p className="text-muted">
              Monday – Saturday: 10:00 AM – 7:00 PM<br />
              Sunday: Closed
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
