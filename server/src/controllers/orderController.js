
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

// Get all orders or filter by customer phone number
export async function getOrders(req, res, next) {
  try {
    const filter = {};

    if (req.query.phone) {
      filter.customerPhone = String(req.query.phone);
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json(orders);
  } catch (error) {
    return next(error);
  }
}

// Create a new order
export async function createOrder(req, res, next) {
  const reservedStock = [];

  try {
    const {
      customerName,
      customerPhone,
      address,
      items
    } = req.body || {};

    if (
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof customerPhone !== "string" ||
      !customerPhone.trim() ||
      typeof address !== "string" ||
      !address.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Please complete delivery details and add at least one item."
      });
    }

    for (const item of items) {
      if (!item || !mongoose.isValidObjectId(item.productId)) {
        return res.status(400).json({
          message: "Invalid product ID."
        });
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          message: "Quantity must be a positive whole number."
        });
      }
    }

    const finalItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      const isSurplus = item.isSurplus === true;

      let product;

      if (isSurplus) {
        // Reserve both regular stock and surplus stock atomically.
        product = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            available: true,
            quantity: { $gte: quantity },
            rescueEnabled: true,
            rescueQuantity: { $gte: quantity },
            rescuePrice: { $gt: 0 },
            $expr: { $lt: ["$rescuePrice", "$price"] },
            rescueExpiry: { $gt: new Date() }
          },
          {
            $inc: {
              quantity: -quantity,
              rescueQuantity: -quantity
            }
          },
          { new: true }
        );

        if (!product) {
          const error = new Error(
            "This surplus offer has expired or has insufficient stock. Refresh Surplus Deals and try again."
          );
          error.status = 400;
          throw error;
        }

        reservedStock.push({
          productId: product._id,
          quantity,
          isSurplus: true
        });

        finalItems.push({
          product: product._id,
          name: product.name,
          price: product.rescuePrice,
          unit: product.unit,
          quantity,
          farmer: product.farmer,
          isSurplus: true
        });
      } else {
        product = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            available: true,
            quantity: { $gte: quantity }
          },
          {
            $inc: { quantity: -quantity }
          },
          { new: true }
        );

        if (!product) {
          const error = new Error(
            "A product is unavailable or has insufficient stock. Refresh the catalogue and try again."
          );
          error.status = 400;
          throw error;
        }

        reservedStock.push({
          productId: product._id,
          quantity,
          isSurplus: false
        });

        finalItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          quantity,
          farmer: product.farmer,
          isSurplus: false
        });
      }
    }

    const subtotal = finalItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const deliveryFee = subtotal >= 300 ? 0 : 30;
    const total = subtotal + deliveryFee;

    const order = await Order.create({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      address: address.trim(),
      items: finalItems,
      subtotal,
      deliveryFee,
      total,
      paymentMethod: "Cash on Delivery",
      paymentStatus: "Pending",
      status: "Placed"
    });

    // The order was saved successfully; do not roll back its stock.
    reservedStock.length = 0;

    return res.status(201).json(order);
  } catch (error) {
    // Restore the exact stock fields reserved by this order attempt.
    for (const reservation of reservedStock.reverse()) {
      try {
        const increment = reservation.isSurplus
          ? {
              quantity: reservation.quantity,
              rescueQuantity: reservation.quantity
            }
          : {
              quantity: reservation.quantity
            };

        await Product.updateOne(
          { _id: reservation.productId },
          { $inc: increment }
        );
      } catch (rollbackError) {
        console.error("Failed to restore product stock:", rollbackError);
      }
    }

    return next(error);
  }
}

// Update the status of an order
export async function updateOrderStatus(req, res, next) {
  try {
    const allowedNext = {
      Placed: ["Accepted", "Cancelled"],
      Accepted: ["Packed", "Cancelled"],
      Packed: ["Delivered"],
      Delivered: [],
      Cancelled: []
    };

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    const { status } = req.body || {};

    if (!allowedNext[order.status]?.includes(status)) {
      return res.status(400).json({
        message:
          `Cannot change order status from ${order.status} to ${status}.`
      });
    }

    // Do not cancel until stock restoration is implemented safely
    if (status === "Cancelled") {
      return res.status(501).json({
        message:
          "Cancellation stock restoration is not implemented. " +
          "This order was not changed."
      });
    }

    order.status = status;
    await order.save();

    return res.json(order);
  } catch (error) {
    return next(error);
  }
}
