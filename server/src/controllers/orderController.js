
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

    // 1. Validate customer details and cart
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
        message:
          "Please complete delivery details and add at least one item."
      });
    }

    // 2. Validate all cart items before changing stock
    for (const item of items) {
      if (
        !item ||
        !mongoose.isValidObjectId(item.productId)
      ) {
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

    // 3. Reserve stock and prepare order items
    const finalItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity);

      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          available: true,
          quantity: { $gte: quantity }
        },
        {
          $inc: { quantity: -quantity }
        },
        {
          new: true
        }
      );

      if (!product) {
        const error = new Error(
          "A product is unavailable or has insufficient stock. " +
          "Refresh the catalogue and try again."
        );

        error.status = 400;
        throw error;
      }

      // Remember each stock change for possible restoration
      reservedStock.push({
        productId: product._id,
        quantity
      });

      finalItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        quantity,
        farmer: product.farmer
      });
    }

    // 4. Calculate prices on the server
    const subtotal = finalItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const deliveryFee = subtotal >= 300 ? 0 : 30;
    const total = subtotal + deliveryFee;

    // 5. Save the order
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

    // Stock changes are now associated with the saved order
    reservedStock.length = 0;

    // 6. Send the created order to the frontend
    return res.status(201).json(order);

  } catch (error) {
    // 7. Try to restore stock if order creation failed
    for (const reservation of reservedStock.reverse()) {
      try {
        await Product.updateOne(
          { _id: reservation.productId },
          { $inc: { quantity: reservation.quantity } }
        );
      } catch (rollbackError) {
        console.error(
          "Failed to restore product stock:",
          rollbackError
        );
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
