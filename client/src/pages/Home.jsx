
import React from "react";
import { Sprout, Leaf, CheckCircle2, Package, ArrowRight } from "lucide-react";
import ProductCard from "../components/ProductCard.jsx";
import Empty from "../components/Empty.jsx";

export default function Home({
  visibleProducts,
  categories,
  setCategory,
  user,
  addToCart,
  editProduct,
  deleteProduct,
  openProduct,
  pid,
  category,
  t
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">
            <Sprout size={15} /> {t.heroEyebrow}
          </span>

          <h1>
            {t.heroTitle}
            <br />
            <span>{t.heroHighlight}</span>
          </h1>

          <p>{t.heroDescription}</p>

          <div className="hero-actions">
            <button
              className="btn btn-light"
              onClick={() =>
                document
                  .getElementById("products")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {t.exploreProduce} <ArrowRight size={17} />
            </button>

            <span>
              <CheckCircle2 size={16} /> {t.freshLocalFair}
            </span>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000"
            alt={t.freshPicks}
          />
        </div>

        <div className="hero-badge">
          <span><Leaf size={18} /></span>
          <div>
            <strong>{t.grownWithCare}</strong>
            <small>{t.fromLocalFarms}</small>
          </div>
        </div>
      </section>

      <section className="benefits">
        <div>
          <span className="benefit-icon"><Sprout /></span>
          <div>
            <strong>{t.directFromFarmers}</strong>
            <small>{t.knowFoodSource}</small>
          </div>
        </div>

        <div>
          <span className="benefit-icon"><CheckCircle2 /></span>
          <div>
            <strong>{t.fairClearPricing}</strong>
            <small>{t.transparentPrices}</small>
          </div>
        </div>

        <div>
          <span className="benefit-icon"><Package /></span>
          <div>
            <strong>{t.freshPicks}</strong>
            <small>{t.seasonalProduce}</small>
          </div>
        </div>
      </section>

      <section id="products" className="section-head">
        <div>
          <span className="eyebrow green">{t.freshFromFarm}</span>
          <h2>{t.harvest}</h2>
          <p>{t.discover}</p>
        </div>

        <span className="result-count">
          {visibleProducts.length} {t.productsAvailable}
        </span>
      </section>

      <div className="category-row">
        {categories.map((c) => (
          <button
            key={c}
            className={`category-pill ${category === c ? "active" : ""}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {visibleProducts.length ? (
        <div className="product-grid">
          {visibleProducts.map((p) => (
            <ProductCard
              key={pid(p)}
              p={p}
              user={user}
              add={addToCart}
              edit={editProduct}
              del={deleteProduct}
              open={openProduct}
              t={t}
            />
          ))}
        </div>
      ) : (
        <Empty
          title={t.noProduceFound}
          text={t.tryAnotherSearch}
        />
      )}
    </>
  );
}
