import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getWishlist, addWishlist, removeWishlist } from '../controllers/wishlistController.js';
const router = Router();
router.use(protect);
router.get('/', getWishlist);
router.put('/:productId', addWishlist);
router.delete('/:productId', removeWishlist);
export default router;
