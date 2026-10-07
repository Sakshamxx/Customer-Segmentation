import ProductSliceScroll from "./components/ProductSliceScroll";
import { products } from "./data/products";

function App() {
  return (
    <main>
      <ProductSliceScroll products={products} />
    </main>
  );
}

export default App;