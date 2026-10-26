async function verify() {
  const urls = [
    'http://localhost:3000/favicon.ico',
    'http://localhost:3000/icon.png',
    'http://localhost:3000/apple-icon.png',
    'http://localhost:3000/icon-32x32.png',
  ];

  for (const url of urls) {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    console.log(`${url} => Status: ${res.status}, Type: ${res.headers.get('content-type')}, Size: ${buf.byteLength} bytes`);
  }

  const page = await fetch('http://localhost:3000/').then(r => r.text());
  const iconLinks = page.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*>/gi);
  console.log('Icon tags in page HTML:');
  if (iconLinks) {
    iconLinks.forEach(link => console.log('  ', link));
  } else {
    console.log('  None found');
  }
}

verify().catch(console.error);
