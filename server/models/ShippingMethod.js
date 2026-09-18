import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: { type: String, required: true, unique: true, trim: true }, fee: { type: Number, required: true, min: 0 }, estimatedDays: { type: Number, required: true, min: 1 }, active: { type: Boolean, default: true } }, { timestamps: true });
export default mongoose.model('ShippingMethod', schema);
