import ShippingMethod from '../models/ShippingMethod.js';
export const listShipping = async (_req, res) => res.json({ success: true, data: await ShippingMethod.find({ active: true }).sort({ fee: 1 }) });
export const listAllShipping = async (_req, res) => res.json({ success: true, data: await ShippingMethod.find().sort({ fee: 1 }) });
export const createShipping = async (req, res) => {
  const { name, fee, estimatedDays } = req.body;
  if (typeof name !== 'string' || !name.trim() || !Number.isFinite(Number(fee)) || Number(fee) < 0 || !Number.isInteger(Number(estimatedDays)) || Number(estimatedDays) < 1) return res.status(400).json({ success: false, message: 'Invalid shipping method' });
  res.status(201).json({ success: true, data: await ShippingMethod.create({ name: name.trim(), fee: Number(fee), estimatedDays: Number(estimatedDays) }) });
};
export const updateShipping = async (req, res) => {
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => ['name','fee','estimatedDays','active'].includes(key)));
  const method = await ShippingMethod.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!method) return res.status(404).json({ success: false, message: 'Method not found' });
  res.json({ success: true, data: method });
};
