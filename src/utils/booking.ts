// ["Adult", "Child", "Adult"] -> "2 x Adult, 1 x Child" (checkout summary and confirmation, as in Figma)
export const formatTicketCounts = (typeNames: string[]) => {
  const counts: Record<string, number> = {};
  typeNames.forEach(name => {
    counts[name] = (counts[name] ?? 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, count]) => `${count} x ${name}`)
    .join(", ");
};
