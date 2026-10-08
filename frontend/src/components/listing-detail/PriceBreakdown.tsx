import { formatPrice, pluralize } from "@/lib/format";
import type { Price } from "@/lib/types/booking";

import styles from "./PriceBreakdown.module.css";

/** Server-computed price lines. Fees are mock values for the demo. */
export function PriceBreakdown({ price }: { price: Price }) {
  const fmt = (amount: number) => formatPrice(amount, price.currency);
  return (
    <dl className={styles.list}>
      <div className={styles.row}>
        <dt>
          {fmt(price.nightly_price)} × {pluralize(price.nights, "night")}
        </dt>
        <dd>{fmt(price.subtotal)}</dd>
      </div>
      <div className={styles.row}>
        <dt>Cleaning fee</dt>
        <dd>{fmt(price.cleaning_fee)}</dd>
      </div>
      <div className={styles.row}>
        <dt>Service fee (demo)</dt>
        <dd>{fmt(price.service_fee)}</dd>
      </div>
      <div className={`${styles.row} ${styles.total}`}>
        <dt>Total</dt>
        <dd>{fmt(price.total)}</dd>
      </div>
    </dl>
  );
}
