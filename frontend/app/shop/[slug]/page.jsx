import ProductDetail from "./ProductDetail";

const API = process.env.NEXT_PUBLIC_API_URL;

export async function generateMetadata({ params }) {
  const { slug } = params;
  
  try {
    const res = await fetch(`${API}/api/products/${slug}`);
    const product = await res.json();
    
    if (!product) return { title: "Product Not Found" };

    return {
      title: product.name,
      description: product.description.substring(0, 160),
      openGraph: {
        title: product.name,
        description: product.description.substring(0, 160),
        images: product.images?.[0] ? [{ url: product.images[0].startsWith("/") ? `${API}${product.images[0]}` : product.images[0] }] : [],
      },
    };
  } catch (err) {
    return { title: "Product" };
  }
}

export default function Page({ params }) {
  return <ProductDetail />;
}
