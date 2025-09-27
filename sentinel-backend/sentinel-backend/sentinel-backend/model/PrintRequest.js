const mongoose = require("mongoose");

const PrintRequestSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Customer" 
  },
  shopkeeperId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShopKeeper",
    default: null,
    set: (value) => {
      // 🛠 Normalize values that aren't valid ObjectIds
      if (!value || value === "null" || value === "" || value === "new-print-shop") {
        return null;
      }
      return value;
    }
  }, 
  filesInfo: [
    {
      id: { type: Number, required: true },
      name: { type: String, required: true },
      pages: { type: Number, required: true },
      size: { type: String, required: true },
      copies: { type: Number, required: true }
    },
  ],
  encryptedData: { type: [Buffer], required: true },
  pages: {
    type: String,
    required: true
  },
  status: { 
    type: String, 
    enum: ["Pending", "Approved", "Printed"],
    default: "Pending" 
  },
  expiresAt: { 
    type: Date,
    required: true 
  }
}, { timestamps: true });

const PrintRequest = mongoose.model("PrintRequest", PrintRequestSchema);
module.exports = PrintRequest;
