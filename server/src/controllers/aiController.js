
import { GoogleGenAI } from "@google/genai";
import Product from "../models/Product.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export async function chatWithAssistant(req, res, next) {
  try {
    const { message } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Please enter a message."
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        message: "Your message must be under 1000 characters."
      });
    }

    // Only use real products that are available and in stock.
    const products = await Product.find({
      available: true,
      quantity: { $gt: 0 }
    })
      .select("name category price unit quantity description farmer image")
      .limit(100)
      .lean();

    const productContext = products.map((product) => ({
      id: String(product._id),
      name: product.name,
      category: product.category,
      price: product.price,
      unit: product.unit,
      quantity: product.quantity,
      description: product.description,
      farmer: product.farmer
    }));

    const prompt = `
You are the AgriCart Smart Shopping Assistant.
Help customers choose fresh agricultural products.

CUSTOMER MESSAGE:
${message.trim()}

AVAILABLE PRODUCTS FROM THE DATABASE:
${JSON.stringify(productContext)}

RULES:
1. Recommend only products listed in the database above.
2. Never invent product names, prices, stock, farmers, or discounts.
3. Use the exact product IDs provided when recommending products.
4. Product price is the price per listed unit.
5. If a customer gives a budget, try to stay within it.
6. Do not claim an item is in the cart or that an order was placed.
7. If no suitable product exists, explain that honestly.
8. Be friendly, concise, and helpful.
9. Return ONLY valid JSON in this format:
{
  "reply": "Your helpful response to the customer",
  "recommendedProductIds": ["real_product_id"]
}
10. recommendedProductIds must contain only IDs from the database list.
11. Return no more than 6 recommended product IDs.
`;

    const result = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let parsed;

    try {
      parsed = JSON.parse(result.text);
    } catch {
      throw new Error("The AI returned an invalid response. Please try again.");
    }

    const validIds = new Set(
      products.map((product) => String(product._id))
    );

    const recommendedProductIds = Array.isArray(
      parsed.recommendedProductIds
    )
      ? [...new Set(
          parsed.recommendedProductIds.filter(
            (id) => typeof id === "string" && validIds.has(id)
          )
        )].slice(0, 6)
      : [];

    const recommendedProducts = products
      .filter((product) =>
        recommendedProductIds.includes(String(product._id))
      )
      .map((product) => ({
        _id: String(product._id),
        name: product.name,
        category: product.category,
        price: product.price,
        unit: product.unit,
        quantity: product.quantity,
        description: product.description,
        farmer: product.farmer,
        image: product.image
      }));

    res.json({
      reply: typeof parsed.reply === "string"
        ? parsed.reply
        : "Here are some products you might like.",
      recommendedProducts
    });
  } catch (error) {
    next(error);
  }
}
