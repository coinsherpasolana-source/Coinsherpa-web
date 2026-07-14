function shortenAddress(address, prefixLen = 4, suffixLen = 4) {
  if (!address || typeof address !== 'string') return '';
  if (address.length <= prefixLen + suffixLen + 3) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

module.exports = { shortenAddress };
