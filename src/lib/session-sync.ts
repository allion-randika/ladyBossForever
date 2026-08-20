import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

/**
 * Call once, right after a successful login/register. Uploads whatever was
 * accumulated locally as a guest (cart lines, wishlist ids) so none of it
 * is lost, merges it with anything already on the account server-side, and
 * adopts the merged result as the new local state.
 */
export async function syncGuestDataToServer(): Promise<void> {
  await Promise.all([
    useCartStore.getState().syncGuestToServer(),
    useWishlistStore.getState().syncGuestToServer(),
  ]);
}

/**
 * Call on logout. The cart/wishlist that were just visible belonged to the
 * account that logged out — the next guest on this browser (or the next
 * customer, on a shared device) shouldn't inherit them.
 */
export function clearGuestVisibleData(): void {
  useCartStore.getState().clearLocal();
  useWishlistStore.getState().clearLocal();
}
