// Presentation fixture only. No execution results or backend contracts live here.
export const sampleCase = {
  id: 'sample-coupon',
  title: 'Discount stays unchanged after removing an item',
  report:
    'After applying SAVE10 and removing Item B, the discount does not update and the cart total is too low.',
  expectedBehavior:
    'The 10% discount should recalculate against the current subtotal. After removing Item B, the subtotal is $100, the discount is $10, and the total is $90.',
  requirementId: 'REQ-CART-001',
} as const;

export const sampleWorkspacePath = `/investigations/${sampleCase.id}`;
export const sampleResultPath = `${sampleWorkspacePath}/result`;
