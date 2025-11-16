// Utility function to generate invoice numbers
function generateInvoiceNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
}

module.exports = {
  generateInvoiceNumber
};
