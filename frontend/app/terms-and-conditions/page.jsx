import Navbar from "@/components/Navbar";

export default function TermsAndConditions() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-ink mb-8">Terms and Conditions</h1>
        <div className="prose prose-sm max-w-none text-muted leading-relaxed space-y-6">
          <p>Welcome to MS Furniture & Interiors. These terms and conditions outline the rules and regulations for the use of our website.</p>
          
          <h2 className="text-xl font-medium text-ink mt-8 mb-4">1. Introduction</h2>
          <p>By accessing this website, we assume you accept these terms and conditions. Do not continue to use MS Furniture & Interiors if you do not agree to take all of the terms and conditions stated on this page.</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">2. Intellectual Property Rights</h2>
          <p>Other than the content you own, under these Terms, MS Furniture & Interiors and/or its licensors own all the intellectual property rights and materials contained in this Website.</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">3. Restrictions</h2>
          <p>You are specifically restricted from all of the following:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Publishing any Website material in any other media;</li>
            <li>Selling, sublicensing and/or otherwise commercializing any Website material;</li>
            <li>Publicly performing and/or showing any Website material;</li>
            <li>Using this Website in any way that is or may be damaging to this Website;</li>
          </ul>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">4. Governing Law & Jurisdiction</h2>
          <p>These Terms will be governed by and interpreted in accordance with the laws of India, and you submit to the non-exclusive jurisdiction of the state and federal courts located in Kerala for the resolution of any disputes.</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">5. Contact Information</h2>
          <p>
            <strong>MS Furniture & Interiors</strong><br />
            Address: VHPH+RQ9, Curzon Rd, Kallupalam, Thangassery, Kollam, Kerala 691013<br />
            Phone: 99953 22809
          </p>
        </div>
      </main>
    </>
  );
}
