import { useState } from "react";

/** The four made-up prices let the reader check both assignment rules by hand. */
const cards = [
  { id: "A", industry: "Dentists", price: 8 },
  { id: "B", industry: "Dentists", price: 10 },
  { id: "C", industry: "Marinas", price: 12 },
  { id: "D", industry: "Jails", price: 8 },
];
const options = [
  [0, 1, 3],
  [1, 2, 3],
  [0, 2, 3],
];
export function TrioExample() {
  const [choice, setChoice] = useState(0);
  const selected = options[choice].map((i) => cards[i]);
  const total = selected.reduce((sum, card) => sum + card.price, 0);
  const different = new Set(selected.map((card) => card.industry)).size === 3;
  return (
    <div className="trio-example">
      <p>
        Four made-up software companies. Each card shows who uses the software
        and the estimated price to buy the company. The budget is $30 million.
      </p>
      <div className="teaching-cards">
        {cards.map((card) => (
          <div
            key={card.id}
            className={selected.includes(card) ? "chosen" : ""}
          >
            <strong>
              {card.id} · {card.industry}
            </strong>
            <span>${card.price}M</span>
          </div>
        ))}
      </div>
      <div className="teaching-options" aria-label="Choose a group">
        {options.map((ids, i) => (
          <button
            type="button"
            key={i}
            aria-pressed={choice === i}
            onClick={() => setChoice(i)}
          >
            {ids.map((n) => cards[n].id).join(" + ")}
          </button>
        ))}
      </div>
      <p className="teaching-outcome" aria-live="polite">
        <b>
          {different && total < 30 ? "Keep this group." : "Skip this group."}
        </b>{" "}
        {selected.map((c) => "$" + c.price + "M").join(" + ")} = ${total}M.{" "}
        {!different
          ? "Two companies sell to dentists. We need three different industries."
          : total === 30
            ? "The three industries differ, but the price reaches the limit."
            : "Three different industries, with $2M left under the limit."}
      </p>
    </div>
  );
}
