import Navbar from "@/components/Navbar";

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-ink mb-8">Privacy Policy</h1>
        <div className="prose prose-sm max-w-none text-muted leading-relaxed space-y-6">
          <p>Your privacy is important to us. It is MS Furniture & Interiors' policy to respect your privacy regarding any information we may collect from you across our website.</p>
          
          <h2 className="text-xl font-medium text-ink mt-8 mb-4">1. Information We Collect</h2>
          <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">2. Use of Information</h2>
          <p>We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you.</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">3. Data Retention</h2>
          <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">4. Sharing of Information</h2>
          <p>We don’t share any personally identifying information publicly or with third-parties, except when required to by law or to facilitate your order (e.g., sharing address with delivery partners).</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">5. Contact Us</h2>
          <p>If you have any questions about how we handle user data and personal information, feel free to contact us.</p>
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
