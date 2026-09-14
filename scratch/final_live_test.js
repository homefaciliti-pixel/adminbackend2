async function run() {
  const url1 = 'https://backend-1-ux3b.onrender.com/api/checkout-api/9653853414?productId=professional%20Plumber';
  console.log(`Testing URL 1: ${url1}`);
  const res1 = await fetch(url1);
  console.log(`URL 1 Status: ${res1.status}`);
  const data1 = await res1.json();
  console.log('URL 1 Response success:', data1.success, 'product:', data1.product ? data1.product.title : null);

  const url2 = 'https://backend-1-ux3b.onrender.com/api/partners/checkout-api/9653853414?productId=professional%20Plumber';
  console.log(`\nTesting URL 2: ${url2}`);
  const res2 = await fetch(url2);
  console.log(`URL 2 Status: ${res2.status}`);
  const data2 = await res2.json();
  console.log('URL 2 Response success:', data2.success, 'product:', data2.product ? data2.product.title : null);
}

run();
