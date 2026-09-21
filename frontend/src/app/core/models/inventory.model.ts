import { StockState } from "./product.model";

export interface Inventory {
  _id: string;
  variant: string;
  stockQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  status: StockState | "disabled";
}

export interface InventoryAdjustmentPayload {
  variant: string;
  quantityChange: number;
  reason: string;
}
