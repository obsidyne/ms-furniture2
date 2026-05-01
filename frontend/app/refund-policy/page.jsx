import Navbar from "@/components/Navbar";

export default function RefundPolicy() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-ink mb-8">Refund and Cancellation Policy</h1>
        <div className="prose prose-sm max-w-none text-muted leading-relaxed space-y-6">
          <p>At MS Furniture & Interiors, we want you to be completely satisfied with your purchase. If you're not happy with your order, we're here to help.</p>
          
          <h2 className="text-xl font-medium text-ink mt-8 mb-4">1. Returns</h2>
          <p>You have 7 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it. Your item must be in the original packaging.</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">2. Refunds</h2>
          <p>Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item. If your return is approved, we will initiate a refund to your original method of payment.</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">3. Shipping</h2>
          <p>You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable.</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">4. Cancellations</h2>
          <p>Orders can be cancelled within 24 hours of placement for a full refund. After 24 hours, a cancellation fee may apply if the item has already been dispatched or custom-made.</p>

          <h2 className="text-xl font-medium text-ink mt-8 mb-4">5. Contact Us</h2>
          <p>If you have any questions on how to return your item to us, contact us.</p>
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
