
import Order from "../models/Order.js";
import Product from "../models/Product.js";

export async function getFarmerAnalytics(req, res, next) {
  try {
    const farmer = String(req.query.farmer || "").trim();

    if (!farmer) {
      return res.status(400).json({
        message: "Farmer name is required."
      });
    }

    // Read this farmer's current inventory.
    const products = await Product.find({ farmer })
      .select("name category price unit quantity available")
      .lean();

    // Read orders containing products listed by this farmer.
    const orders = await Order.find({
      "items.farmer": farmer
    })
      .sort({ createdAt: -1 })
      .lean();

    const productIds = new Set(
      products.map((product) => String(product._id))
    );

    const inventory = {
      totalProducts: products.length,
      availableProducts: products.filter(
        (product) => product.available && product.quantity > 0
      ).length,
      lowStock: products.filter(
        (product) => product.available && product.quantity > 0 &&
          product.quantity <= 5
      ),
      outOfStock: products.filter(
        (product) => product.quantity <= 0
      ).length
    };

    let totalOrders = 0;
    let deliveredOrders = 0;
    let pendingOrders = 0;
    let cancelledOrders = 0;
    let totalUnitsSold = 0;
    let deliveredRevenue = 0;

    const productSales = new Map();
    const dailySales = new Map();

    for (const order of orders) {
      const farmerItems = order.items.filter(
        (item) => item.farmer === farmer
      );

      if (!farmerItems.length) continue;

      totalOrders++;

      if (order.status === "Delivered") {
        deliveredOrders++;

        for (const item of farmerItems) {
          const quantity = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;
          const lineRevenue = price * quantity;

          deliveredRevenue += lineRevenue;
          totalUnitsSold += quantity;

          const key = String(item.product);

          // Exclude products no longer present in this farmer's
          // current catalogue from the current product ranking.
          if (productIds.has(key)) {
            const existing = productSales.get(key) || {
              productId: key,
              name: item.name,
              unitsSold: 0,
              revenue: 0
            };

            existing.unitsSold += quantity;
            existing.revenue += lineRevenue;
            productSales.set(key, existing);
          }

          const date = new Date(order.createdAt);
          const day = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
          ].join("-");

          dailySales.set(
            day,
            (dailySales.get(day) || 0) + lineRevenue
          );
        }
      } else if (order.status === "Cancelled") {
        cancelledOrders++;
      } else {
        pendingOrders++;
      }
    }

    const topProducts = [...productSales.values()]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    const salesTrend = [...dailySales.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, sales]) => ({
        date,
        sales: Number(sales.toFixed(2))
      }));

    return res.json({
      farmer,
      summary: {
        totalOrders,
        deliveredOrders,
        pendingOrders,
        cancelledOrders,
        deliveredRevenue: Number(deliveredRevenue.toFixed(2)),
        totalUnitsSold
      },
      inventory,
      topProducts,
      salesTrend
    });
  } catch (error) {
    return next(error);
  }
}
